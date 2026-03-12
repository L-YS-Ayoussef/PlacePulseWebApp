const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const placeEmbeddingSchema = new Schema(
  {
    place: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Place",
      unique: true,
    },
    sourceText: { type: String, required: true },
    vector: [{ type: Number, required: true }],
    dimension: { type: Number, required: true },
    model: { type: String, required: true },
    normalized: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlaceEmbedding", placeEmbeddingSchema);
