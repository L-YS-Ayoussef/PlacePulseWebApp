const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const placeInsightSchema = new Schema(
  {
    place: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Place",
      unique: true,
    },
    status: {
      type: String,
      enum: ["ready", "stale", "failed", "pending", "empty"],
      default: "stale",
    },
    reviewsFingerprint: { type: String, default: "" },
    reviewCount: { type: Number, default: 0 },

    summary: {
      highlights: [{ type: String }],
      complaints: [{ type: String }],
      vibe: { type: String, default: "" },
      idealAudience: [{ type: String }],
      tipsBeforeVisiting: [{ type: String }],
      priceAnswer: { type: String, default: "" },
    },

    presetAnswers: {
      likes: { type: String, default: "" },
      complaints: { type: String, default: "" },
      bestFor: {
        couples: { type: String, default: "" },
        families: { type: String, default: "" },
        work: { type: String, default: "" },
        students: { type: String, default: "" },
      },
      expensive: { type: String, default: "" },
      vibe: { type: String, default: "" },
    },

    qaCache: [
      {
        question: { type: String, required: true },
        normalizedQuestion: { type: String, required: true },
        answer: { type: String, required: true },
        confidence: { type: String, default: "medium" },
        basis: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
      },
    ],

    generatedAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlaceInsight", placeInsightSchema);
