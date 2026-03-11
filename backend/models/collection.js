const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const collectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    places: [{ type: mongoose.Types.ObjectId, ref: "Place" }],
    shareToken: { type: String, required: true, unique: true },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true },
);

collectionSchema.index({ owner: 1, name: 1 }, { unique: true });
collectionSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Collection", collectionSchema);
