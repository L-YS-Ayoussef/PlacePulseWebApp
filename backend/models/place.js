const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const mediaItemSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, required: true, enum: ["image", "video"] },
  },
  { _id: false },
);

const placeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    // Cover image used in cards / lists
    image: { type: String, required: true },

    // Full place gallery
    media: { type: [mediaItemSchema], default: [] },

    address: { type: String, required: true },

    // Detailed directions, not used by geocoding
    addressNotes: { type: String, default: "" },

    category: { type: String, default: "other" },
    priceLevel: { type: String, default: "moderate" },
    tags: { type: [String], default: [] },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },

    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviewImagesCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Place", placeSchema);
