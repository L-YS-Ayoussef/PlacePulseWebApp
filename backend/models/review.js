const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 10 },
    visitDate: { type: Date, required: true },
    recommendedFor: [{ type: String }],
    images: [{ type: String }],
    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    place: { type: mongoose.Types.ObjectId, required: true, ref: "Place" },
  },
  { timestamps: true },
);

reviewSchema.index({ creator: 1, place: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
