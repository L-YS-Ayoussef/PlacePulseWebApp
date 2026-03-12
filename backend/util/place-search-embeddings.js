const axios = require("axios");

const Place = require("../models/place");
const PlaceEmbedding = require("../models/place-embedding");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
const EMBEDDING_API_URL =
  process.env.EMBEDDING_API_URL ||
  "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_DIMENSION = Number(process.env.EMBEDDING_DIMENSION || 768);

const cleanText = (value) => `${value || ""}`.trim();

const buildPlaceSearchText = (place) => {
  const parts = [
    `Title: ${cleanText(place.title)}`,
    `Description: ${cleanText(place.description)}`,
    `Category: ${cleanText(place.category || "other")}`,
    `Price level: ${cleanText(place.priceLevel || "moderate")}`,
    `Tags: ${((place.tags || []).join(", ") || "none").trim()}`,
    `Address notes: ${cleanText(place.addressNotes || "")}`,
    `Address: ${cleanText(place.address || "")}`,
  ];

  return parts.filter(Boolean).join("\n");
};

const normalizeVector = (vector) => {
  const magnitude = Math.sqrt(
    vector.reduce((sum, value) => sum + value * value, 0),
  );

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
};

const dotProduct = (a, b) => {
  let sum = 0;

  for (let index = 0; index < a.length; index++) {
    sum += a[index] * b[index];
  }

  return sum;
};

const extractEmbeddingValues = (data) => {
  if (Array.isArray(data?.embedding?.values)) {
    return data.embedding.values;
  }

  if (Array.isArray(data?.embeddings) && data.embeddings[0]?.values) {
    return data.embeddings[0].values;
  }

  return null;
};

const embedText = async (text, taskType) => {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from the backend environment.");
  }

  const endpoint = `${EMBEDDING_API_URL}/models/${EMBEDDING_MODEL}:embedContent`;

  const response = await axios.post(
    endpoint,
    {
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }],
      },
      taskType,
      output_dimensionality: EMBEDDING_DIMENSION,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      timeout: 45000,
    },
  );

  const values = extractEmbeddingValues(response.data);

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Embedding response did not contain a valid vector.");
  }

  return normalizeVector(values);
};

const upsertPlaceEmbedding = async (place) => {
  const sourceText = buildPlaceSearchText(place);
  const vector = await embedText(sourceText, "RETRIEVAL_DOCUMENT");

  await PlaceEmbedding.findOneAndUpdate(
    { place: place.id || place._id },
    {
      place: place.id || place._id,
      sourceText,
      vector,
      dimension: vector.length,
      model: EMBEDDING_MODEL,
      normalized: true,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
};

const deletePlaceEmbedding = async (placeId) => {
  await PlaceEmbedding.deleteOne({ place: placeId });
};

const ensureEmbeddingsForAllPlaces = async () => {
  const allPlaces = await Place.find({}).sort({ createdAt: -1 });

  if (!allPlaces.length) {
    return;
  }

  const existingEmbeddings = await PlaceEmbedding.find({
    place: { $in: allPlaces.map((place) => place._id) },
  }).select("place");

  const existingPlaceIds = new Set(
    existingEmbeddings.map((embedding) => embedding.place.toString()),
  );

  for (const place of allPlaces) {
    if (!existingPlaceIds.has(place._id.toString())) {
      await upsertPlaceEmbedding(place);
    }
  }
};

const searchPlacesBySemanticQuery = async (query, limit = 24) => {
  const cleanQuery = cleanText(query);

  if (!cleanQuery) {
    return [];
  }

  await ensureEmbeddingsForAllPlaces();

  const queryVector = await embedText(cleanQuery, "RETRIEVAL_QUERY");

  const storedEmbeddings = await PlaceEmbedding.find({})
    .populate({
      path: "place",
      populate: { path: "creator", select: "name image" },
    })
    .sort({ updatedAt: -1 });

  const scoredPlaces = storedEmbeddings
    .filter(
      (embeddingDoc) =>
        embeddingDoc.place &&
        Array.isArray(embeddingDoc.vector) &&
        embeddingDoc.vector.length === queryVector.length,
    )
    .map((embeddingDoc) => {
      const placeObject = embeddingDoc.place.toObject({
        getters: true,
        versionKey: false,
      });

      const score = dotProduct(queryVector, embeddingDoc.vector);

      return {
        ...placeObject,
        semanticScore: score,
      };
    })
    .sort((first, second) => second.semanticScore - first.semanticScore)
    .slice(0, limit);

  return scoredPlaces;
};

module.exports = {
  buildPlaceSearchText,
  upsertPlaceEmbedding,
  deletePlaceEmbedding,
  searchPlacesBySemanticQuery,
};
