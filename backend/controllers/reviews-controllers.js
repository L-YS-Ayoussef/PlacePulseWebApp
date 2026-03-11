const fs = require("fs");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const Review = require("../models/review");
const recalculatePlaceReviewStats = require("../util/place-review-stats");
const { markPlaceInsightStale } = require("../util/place-insights-ai");

const parseRecommendedFor = (recommendedFor) => {
  if (!recommendedFor) {
    return [];
  }

  if (Array.isArray(recommendedFor)) {
    return recommendedFor.map((tag) => tag.trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(recommendedFor);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => `${tag}`.trim()).filter(Boolean);
    }
  } catch (err) {}

  return `${recommendedFor}`
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parseRemovedImages = (removedImages) => {
  if (!removedImages) {
    return [];
  }

  if (Array.isArray(removedImages)) {
    return removedImages;
  }

  try {
    const parsed = JSON.parse(removedImages);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

const serializeDoc = (doc) =>
  doc.toObject({ getters: true, versionKey: false });

const getReviewsByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid;

  let reviews;
  try {
    reviews = await Review.find({ place: placeId })
      .populate("creator", "name image")
      .sort({ createdAt: -1 });
  } catch (err) {
    return next(
      new HttpError("Fetching reviews failed, please try again later.", 500),
    );
  }

  res.json({ reviews: reviews.map(serializeDoc) });
};

const createReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid review data, please check your inputs.", 422),
    );
  }

  const { rating, comment, visitDate } = req.body;
  const recommendedFor = parseRecommendedFor(req.body.recommendedFor);
  const placeId = req.params.pid;
  const imagePaths = (req.files || []).map((file) => file.path);

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Creating review failed, please try again later.", 500),
    );
  }

  if (!place) {
    return next(
      new HttpError("Could not find place for the provided id.", 404),
    );
  }

  let existingReview;
  try {
    existingReview = await Review.findOne({
      place: placeId,
      creator: req.userData.userId,
    });
  } catch (err) {
    return next(
      new HttpError("Creating review failed, please try again later.", 500),
    );
  }

  if (existingReview) {
    return next(new HttpError("You already reviewed this place.", 422));
  }

  const createdReview = new Review({
    rating: Number(rating),
    comment,
    visitDate,
    recommendedFor,
    images: imagePaths,
    creator: req.userData.userId,
    place: placeId,
  });

  try {
    await createdReview.save();
    await recalculatePlaceReviewStats(placeId);
    await markPlaceInsightStale(placeId);
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Creating review failed, please try again.", 500),
    );
  }

  let populatedReview;
  try {
    populatedReview = await Review.findById(createdReview.id).populate(
      "creator",
      "name image",
    );
  } catch (err) {
    return next(new HttpError("Review created, but fetching it failed.", 500));
  }

  res.status(201).json({ review: serializeDoc(populatedReview) });
};

const updateReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid review data, please check your inputs.", 422),
    );
  }

  const reviewId = req.params.rid;
  const { rating, comment, visitDate } = req.body;
  const recommendedFor = parseRecommendedFor(req.body.recommendedFor);
  const removedImages = parseRemovedImages(req.body.removedImages);
  const newImagePaths = (req.files || []).map((file) => file.path);

  let review;
  try {
    review = await Review.findById(reviewId).populate("creator", "name image");
  } catch (err) {
    return next(
      new HttpError("Updating review failed, please try again later.", 500),
    );
  }

  if (!review) {
    return next(
      new HttpError("Could not find review for the provided id.", 404),
    );
  }

  if (review.creator.id !== req.userData.userId) {
    return next(new HttpError("You are not allowed to edit this review.", 403));
  }

  const keptExistingImages = (review.images || []).filter(
    (image) => !removedImages.includes(image),
  );
  const finalImages = [...keptExistingImages, ...newImagePaths];

  if (finalImages.length > 4) {
    newImagePaths.forEach((imagePath) => {
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.log(err);
        }
      });
    });

    return next(new HttpError("A review can contain at most 4 images.", 422));
  }

  review.rating = Number(rating);
  review.comment = comment;
  review.visitDate = visitDate;
  review.recommendedFor = recommendedFor;
  review.images = finalImages;

  try {
    await review.save();
    await recalculatePlaceReviewStats(review.place);
    await markPlaceInsightStale(review.place);
  } catch (err) {
    return next(
      new HttpError("Updating review failed, please try again.", 500),
    );
  }

  removedImages.forEach((imagePath) => {
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });

  let populatedReview;
  try {
    populatedReview = await Review.findById(review.id).populate(
      "creator",
      "name image",
    );
  } catch (err) {
    return next(new HttpError("Review updated, but fetching it failed.", 500));
  }

  res.status(200).json({ review: serializeDoc(populatedReview) });
};

const deleteReview = async (req, res, next) => {
  const reviewId = req.params.rid;

  let review;
  try {
    review = await Review.findById(reviewId).populate("creator", "name image");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete review.", 500),
    );
  }

  if (!review) {
    return next(new HttpError("Could not find review for this id.", 404));
  }

  if (review.creator.id !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to delete this review.", 403),
    );
  }

  const imagePaths = [...review.images];
  const placeId = review.place;

  try {
    await review.deleteOne();
    await recalculatePlaceReviewStats(placeId);
    await markPlaceInsightStale(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete review.", 500),
    );
  }

  imagePaths.forEach((imagePath) => {
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });

  res.status(200).json({ message: "Deleted review." });
};

exports.getReviewsByPlaceId = getReviewsByPlaceId;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.deleteReview = deleteReview;
