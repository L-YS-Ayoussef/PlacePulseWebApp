const mongoose = require("mongoose");

const Place = require("../models/place");
const Review = require("../models/review");

const recalculatePlaceReviewStats = async (placeId) => {
  const objectId = new mongoose.Types.ObjectId(placeId);

  const [stats] = await Review.aggregate([
    { $match: { place: objectId } },
    {
      $group: {
        _id: "$place",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        reviewImagesCount: { $sum: { $size: "$images" } },
      },
    },
  ]);

  await Place.findByIdAndUpdate(placeId, {
    averageRating: stats ? Number(stats.averageRating.toFixed(1)) : 0,
    reviewCount: stats ? stats.reviewCount : 0,
    reviewImagesCount: stats ? stats.reviewImagesCount : 0,
  });
};

module.exports = recalculatePlaceReviewStats;
