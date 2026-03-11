const crypto = require("crypto");
const axios = require("axios");

const PlaceInsight = require("../models/place-insight");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL =
  process.env.GEMINI_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta";
const AI_PLACE_QA_MAX_CHARS = Number(process.env.AI_PLACE_QA_MAX_CHARS || 250);
const AI_PLACE_REVIEW_TEXT_LIMIT = Number(
  process.env.AI_PLACE_REVIEW_TEXT_LIMIT || 12000,
);

const PLACE_SUMMARY_SCHEMA = {
  type: "OBJECT",
  properties: {
    highlights: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    complaints: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    vibe: { type: "STRING" },
    idealAudience: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    tipsBeforeVisiting: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    priceAnswer: { type: "STRING" },
    presetAnswers: {
      type: "OBJECT",
      properties: {
        likes: { type: "STRING" },
        complaints: { type: "STRING" },
        bestFor: {
          type: "OBJECT",
          properties: {
            couples: { type: "STRING" },
            families: { type: "STRING" },
            work: { type: "STRING" },
            students: { type: "STRING" },
          },
          required: ["couples", "families", "work", "students"],
        },
        expensive: { type: "STRING" },
        vibe: { type: "STRING" },
      },
      required: ["likes", "complaints", "bestFor", "expensive", "vibe"],
    },
  },
  required: [
    "highlights",
    "complaints",
    "vibe",
    "idealAudience",
    "tipsBeforeVisiting",
    "priceAnswer",
    "presetAnswers",
  ],
};

const PLACE_QA_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    confidence: {
      type: "STRING",
      enum: ["low", "medium", "high"],
    },
    basis: {
      type: "ARRAY",
      items: { type: "STRING" },
      maxItems: 2,
    },
  },
  required: ["answer", "confidence", "basis"],
};

const toText = (value) => `${value || ""}`.trim();

const uniqueStrings = (items, maxItems = 6) => {
  const seen = new Set();
  const result = [];

  (items || []).forEach((item) => {
    const nextItem = toText(item);
    const normalized = nextItem.toLowerCase();

    if (!nextItem || seen.has(normalized) || result.length >= maxItems) {
      return;
    }

    seen.add(normalized);
    result.push(nextItem);
  });

  return result;
};

const sliceText = (value, maxLength = 600) => {
  const nextValue = toText(value);

  if (nextValue.length <= maxLength) {
    return nextValue;
  }

  return `${nextValue.slice(0, maxLength - 1).trim()}…`;
};

const normalizeQuestion = (question) =>
  toText(question)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, AI_PLACE_QA_MAX_CHARS);

const buildReviewsFingerprint = (reviews) => {
  const fingerprintInput = (reviews || []).map((review) => ({
    id: `${review.id || review._id || ""}`,
    updatedAt: review.updatedAt ? new Date(review.updatedAt).toISOString() : "",
    rating: review.rating,
    comment: review.comment,
    visitDate: review.visitDate ? new Date(review.visitDate).toISOString() : "",
    recommendedFor: review.recommendedFor || [],
  }));

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(fingerprintInput))
    .digest("hex");
};

const buildReviewCorpus = (place, reviews) => {
  const intro = [
    `Place title: ${sliceText(place.title, 120)}`,
    `Category: ${sliceText(place.category || "other", 60)}`,
    `Price level field: ${sliceText(place.priceLevel || "moderate", 40)}`,
    `Tags: ${((place.tags || []).join(", ") || "none").slice(0, 160)}`,
    `Current rating stats: ${place.averageRating || 0} average from ${place.reviewCount || reviews.length || 0} reviews.`,
    "",
    "Reviews:",
  ];

  const lines = [...intro];
  let usedChars = intro.join("\n").length;

  for (const [index, review] of (reviews || []).entries()) {
    const reviewLines = [
      `Review ${index + 1}:`,
      `- Rating: ${review.rating}/5`,
      `- Visit date: ${
        review.visitDate
          ? new Date(review.visitDate).toISOString().slice(0, 10)
          : "unknown"
      }`,
      `- Recommended for: ${((review.recommendedFor || []).join(", ") || "none").slice(0, 120)}`,
      `- Comment: ${sliceText(review.comment, 700)}`,
      "",
    ];

    const nextBlock = reviewLines.join("\n");

    if (usedChars + nextBlock.length > AI_PLACE_REVIEW_TEXT_LIMIT) {
      break;
    }

    lines.push(...reviewLines);
    usedChars += nextBlock.length;
  }

  return lines.join("\n");
};

const getGeminiText = (responseData) => {
  const text = (responseData?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || "")
    .join("\n")
    .trim();

  return text;
};

const safeJsonParse = (rawText) => {
  const normalizedText = `${rawText || ""}`
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(normalizedText);
  } catch (firstError) {
    const firstBrace = normalizedText.indexOf("{");
    const lastBrace = normalizedText.lastIndexOf("}");
    const firstBracket = normalizedText.indexOf("[");
    const lastBracket = normalizedText.lastIndexOf("]");

    const objectSlice =
      firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
        ? normalizedText.slice(firstBrace, lastBrace + 1)
        : null;

    const arraySlice =
      firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket
        ? normalizedText.slice(firstBracket, lastBracket + 1)
        : null;

    if (objectSlice) {
      try {
        return JSON.parse(objectSlice);
      } catch (err) {}
    }

    if (arraySlice) {
      try {
        return JSON.parse(arraySlice);
      } catch (err) {}
    }

    throw firstError;
  }
};

const generateStructuredJson = async ({
  prompt,
  schema,
  temperature = 0.25,
  maxOutputTokens = 1400,
}) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the backend environment.");
  }

  const endpoint = `${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent`;

  let lastError;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.post(
        endpoint,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature,
            maxOutputTokens,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          timeout: 45000,
        },
      );

      const text = getGeminiText(response.data);

      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }
    
    //   console.log("RAW GEMINI JSON TEXT:");
    //   console.log(text);
    //   console.log(
    //     "finishReason:",
    //     response.data?.candidates?.[0]?.finishReason,
    //   );
    //   console.log("usageMetadata:", response.data?.usageMetadata);

      return safeJsonParse(text);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
};

const sanitizeSummaryPayload = (payload) => {
  const presetBestFor = payload?.presetAnswers?.bestFor || {};

  return {
    summary: {
      highlights: uniqueStrings(payload?.highlights, 5),
      complaints: uniqueStrings(payload?.complaints, 5),
      vibe: sliceText(payload?.vibe, 220),
      idealAudience: uniqueStrings(payload?.idealAudience, 5),
      tipsBeforeVisiting: uniqueStrings(payload?.tipsBeforeVisiting, 5),
      priceAnswer: sliceText(payload?.priceAnswer, 220),
    },
    presetAnswers: {
      likes: sliceText(payload?.presetAnswers?.likes, 280),
      complaints: sliceText(payload?.presetAnswers?.complaints, 280),
      bestFor: {
        couples: sliceText(presetBestFor.couples, 220),
        families: sliceText(presetBestFor.families, 220),
        work: sliceText(presetBestFor.work, 220),
        students: sliceText(presetBestFor.students, 220),
      },
      expensive: sliceText(payload?.presetAnswers?.expensive, 220),
      vibe: sliceText(payload?.presetAnswers?.vibe, 220),
    },
  };
};

const sanitizeQuestionAnswer = (payload) => {
  const confidence = ["low", "medium", "high"].includes(payload?.confidence)
    ? payload.confidence
    : "medium";

  return {
    answer: sliceText(payload?.answer, 500),
    confidence,
    basis: uniqueStrings(payload?.basis, 3),
  };
};

const buildSummaryPrompt = (place, reviews) => {
  const reviewCorpus = buildReviewCorpus(place, reviews);

  return [
    "Summarize these place reviews.",
    "Use only the provided reviews.",
    "Do not invent facts.",
    "If evidence is mixed or weak, say so briefly.",
    "Return only valid JSON that matches the schema.",
    "",
    reviewCorpus,
  ].join("\n");
};

const buildQuestionPrompt = (place, reviews, insight, question) => {
  const reviewCorpus = buildReviewCorpus(place, reviews);

  return [
    "Answer the question using only the place summary, preset answers, and reviews below.",
    "Do not invent facts.",
    "Return only valid JSON that matches the schema.",
    "Keep the answer under 80 words.",
    "Set basis to at most 2 very short evidence bullets.",
    "Each basis item must be under 12 words.",
    "Do not quote long review text.",
    "",
    `Question: ${sliceText(question, AI_PLACE_QA_MAX_CHARS)}`,
    "",
    `Summary: ${JSON.stringify(insight.summary || {})}`,
    `Preset answers: ${JSON.stringify(insight.presetAnswers || {})}`,
    "",
    reviewCorpus,
  ].join("\n");
};

const hasSummaryContent = (insight) => {
  if (!insight) {
    return false;
  }

  return Boolean(
    (insight.summary?.highlights || []).length ||
    (insight.summary?.complaints || []).length ||
    insight.summary?.vibe ||
    (insight.summary?.idealAudience || []).length ||
    (insight.summary?.tipsBeforeVisiting || []).length ||
    insight.summary?.priceAnswer,
  );
};

const ensureEmptyInsight = async (placeId, fingerprint) => {
  let insight = await PlaceInsight.findOne({ place: placeId });

  if (!insight) {
    insight = new PlaceInsight({ place: placeId });
  }

  insight.status = "empty";
  insight.reviewsFingerprint = fingerprint;
  insight.reviewCount = 0;
  insight.summary = {
    highlights: [],
    complaints: [],
    vibe: "",
    idealAudience: [],
    tipsBeforeVisiting: [],
    priceAnswer: "",
  };
  insight.presetAnswers = {
    likes: "",
    complaints: "",
    bestFor: {
      couples: "",
      families: "",
      work: "",
      students: "",
    },
    expensive: "",
    vibe: "",
  };
  insight.qaCache = [];
  insight.generatedAt = null;
  insight.lastError = "";

  await insight.save();
  return insight;
};

const getOrGeneratePlaceInsight = async (place, reviews, options = {}) => {
  const { forceRefresh = false } = options;
  const fingerprint = buildReviewsFingerprint(reviews || []);
  const placeId = place.id || place._id;

  if (!reviews || reviews.length === 0) {
    return ensureEmptyInsight(placeId, fingerprint);
  }

  let insight = await PlaceInsight.findOne({ place: placeId });

  const isFresh =
    insight &&
    insight.status === "ready" &&
    insight.reviewsFingerprint === fingerprint;

  if (!forceRefresh && isFresh) {
    return insight;
  }

  if (!insight) {
    insight = new PlaceInsight({ place: placeId });
  }

  insight.status = "pending";
  insight.reviewCount = reviews.length;
  await insight.save();

  try {
    const rawPayload = await generateStructuredJson({
      prompt: buildSummaryPrompt(place, reviews),
      schema: PLACE_SUMMARY_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 1200,
    });

    const sanitized = sanitizeSummaryPayload(rawPayload);

    insight.status = "ready";
    insight.reviewsFingerprint = fingerprint;
    insight.reviewCount = reviews.length;
    insight.summary = sanitized.summary;
    insight.presetAnswers = sanitized.presetAnswers;
    insight.qaCache = [];
    insight.generatedAt = new Date();
    insight.lastError = "";

    await insight.save();
    return insight;
  } catch (error) {
    if (hasSummaryContent(insight)) {
      insight.status = "stale";
      insight.reviewsFingerprint = fingerprint;
      insight.reviewCount = reviews.length;
      insight.lastError = error.message || "Gemini generation failed.";
      await insight.save();
      return insight;
    }

    insight.status = "failed";
    insight.reviewsFingerprint = fingerprint;
    insight.reviewCount = reviews.length;
    insight.lastError = error.message || "Gemini generation failed.";
    await insight.save();
    throw error;
  }
};

const answerQuestionAboutPlace = async ({
  place,
  reviews,
  insight,
  question,
}) => {
  if (!reviews || reviews.length === 0) {
    return {
      answer:
        "There are no reviews for this place yet, so there is not enough evidence to answer that question.",
      confidence: "low",
      basis: [],
    };
  }

  const rawPayload = await generateStructuredJson({
    prompt: buildQuestionPrompt(place, reviews, insight, question),
    schema: PLACE_QA_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 1000,
  });

  return sanitizeQuestionAnswer(rawPayload);
};

const markPlaceInsightStale = async (placeId) => {
  await PlaceInsight.findOneAndUpdate(
    { place: placeId },
    { status: "stale" },
    { new: true },
  );
};

const deletePlaceInsight = async (placeId) => {
  await PlaceInsight.deleteOne({ place: placeId });
};

module.exports = {
  AI_PLACE_QA_MAX_CHARS,
  normalizeQuestion,
  buildReviewsFingerprint,
  buildReviewCorpus,
  getOrGeneratePlaceInsight,
  answerQuestionAboutPlace,
  markPlaceInsightStale,
  deletePlaceInsight,
};
