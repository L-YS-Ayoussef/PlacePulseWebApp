const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const Review = require("../models/review");
const PlaceInsight = require("../models/place-insight");
const {
  AI_PLACE_QA_MAX_CHARS,
  normalizeQuestion,
  getOrGeneratePlaceInsight,
  answerQuestionAboutPlace,
} = require("../util/place-insights-ai");

const serializeInsight = (insight) => ({
  id: `${insight.id || insight._id || ""}`,
  status: insight.status,
  reviewCount: insight.reviewCount || 0,
  generatedAt: insight.generatedAt || null,
  summary: {
    highlights: insight.summary?.highlights || [],
    complaints: insight.summary?.complaints || [],
    vibe: insight.summary?.vibe || "",
    idealAudience: insight.summary?.idealAudience || [],
    tipsBeforeVisiting: insight.summary?.tipsBeforeVisiting || [],
    priceAnswer: insight.summary?.priceAnswer || "",
  },
  presetAnswers: {
    likes: insight.presetAnswers?.likes || "",
    complaints: insight.presetAnswers?.complaints || "",
    bestFor: {
      couples: insight.presetAnswers?.bestFor?.couples || "",
      families: insight.presetAnswers?.bestFor?.families || "",
      work: insight.presetAnswers?.bestFor?.work || "",
      students: insight.presetAnswers?.bestFor?.students || "",
    },
    expensive: insight.presetAnswers?.expensive || "",
    vibe: insight.presetAnswers?.vibe || "",
  },
});

const loadPlaceAndReviews = async (placeId) => {
  const place = await Place.findById(placeId);

  if (!place) {
    throw new HttpError("Could not find place for the provided id.", 404);
  }

  const reviews = await Review.find({ place: placeId }).sort({ createdAt: -1 });

  return { place, reviews };
};

const getPlaceInsightByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid;

  let placeData;
  try {
    placeData = await loadPlaceAndReviews(placeId);
  } catch (error) {
    return next(
      error instanceof HttpError
        ? error
        : new HttpError(
            "Fetching place insight failed, please try again later.",
            500,
          ),
    );
  }

  try {
    const insight = await getOrGeneratePlaceInsight(
      placeData.place,
      placeData.reviews,
    );

    res.json({ insight: serializeInsight(insight) });
  } catch (error) {
    let fallbackInsight;
    try {
      fallbackInsight = await PlaceInsight.findOne({ place: placeId });
    } catch (fallbackError) {}

    if (fallbackInsight) {
      return res.json({ insight: serializeInsight(fallbackInsight) });
    }

    return next(
      new HttpError(
        error.message ||
          "Generating the AI review summary failed, please try again later.",
        500,
      ),
    );
  }
};

const askQuestionAboutPlace = async (req, res, next) => {
  const placeId = req.params.pid;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid question, please check your input.", 422),
    );
  }

  const question = `${req.body.question || ""}`.trim();

  if (question.length > AI_PLACE_QA_MAX_CHARS) {
    return next(
      new HttpError(
        `Questions must be ${AI_PLACE_QA_MAX_CHARS} characters or less.`,
        422,
      ),
    );
  }

  let placeData;
  try {
    placeData = await loadPlaceAndReviews(placeId);
  } catch (error) {
    return next(
      error instanceof HttpError
        ? error
        : new HttpError(
            "Answering the question failed, please try again later.",
            500,
          ),
    );
  }

  let insight;
  try {
    insight = await getOrGeneratePlaceInsight(
      placeData.place,
      placeData.reviews,
    );
  } catch (error) {
    return next(
      new HttpError(
        error.message || "Preparing the AI place data failed.",
        500,
      ),
    );
  }

  if (insight.status === "empty") {
    return res.json({
      answer: {
        answer:
          "There are no reviews for this place yet, so there is not enough information to answer that question.",
        confidence: "low",
        basis: [],
      },
    });
  }

  const normalizedQuestion = normalizeQuestion(question);

  const cachedAnswer = (insight.qaCache || []).find(
    (item) => item.normalizedQuestion === normalizedQuestion,
  );

  if (cachedAnswer) {
    return res.json({
      answer: {
        answer: cachedAnswer.answer,
        confidence: cachedAnswer.confidence || "medium",
        basis: cachedAnswer.basis || [],
      },
    });
  }

  try {
    const answer = await answerQuestionAboutPlace({
      place: placeData.place,
      reviews: placeData.reviews,
      insight,
      question,
    });

    insight.qaCache = [
      {
        question,
        normalizedQuestion,
        answer: answer.answer,
        confidence: answer.confidence,
        basis: answer.basis,
        createdAt: new Date(),
      },
      ...(insight.qaCache || []).slice(0, 24),
    ];

    await insight.save();

    res.json({ answer });
  } catch (error) {
    return next(
      new HttpError(
        error.message || "Answering the custom question failed.",
        500,
      ),
    );
  }
};

exports.getPlaceInsightByPlaceId = getPlaceInsightByPlaceId;
exports.askQuestionAboutPlace = askQuestionAboutPlace;
