const fs = require("fs");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const geocodeAddress = require("../util/location");
const Place = require("../models/place");
const Review = require("../models/review");
const User = require("../models/user");

const serializeDoc = (doc) =>
  doc.toObject({ getters: true, versionKey: false });

const parseTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => `${tag}`.trim()).filter(Boolean);
  }

  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => `${tag}`.trim()).filter(Boolean);
    }
  } catch (err) {}

  return `${tags}`
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parseRemovedMedia = (removedMedia) => {
  if (!removedMedia) {
    return [];
  }

  if (Array.isArray(removedMedia)) {
    return removedMedia;
  }

  try {
    const parsed = JSON.parse(removedMedia);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
};

const mapUploadedMedia = (files) =>
  (files || []).map((file) => ({
    url: file.path,
    type: file.mimetype.startsWith("video/") ? "video" : "image",
  }));

const getExistingPlaceMedia = (place) => {
  if (place.media && place.media.length > 0) {
    return place.media;
  }

  if (place.image) {
    return [{ url: place.image, type: "image" }];
  }

  return [];
};

const cleanupFiles = (filePaths) => {
  filePaths.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  });
};

const getRecentPlaces = async (req, res, next) => {
  let places;

  try {
    places = await Place.find({})
      .populate("creator", "name image")
      .sort({ createdAt: -1 })
      .limit(24);
  } catch (err) {
    return next(
      new HttpError(
        "Fetching recent places failed, please try again later.",
        500,
      ),
    );
  }

  res.json({ places: (places || []).map(serializeDoc) });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator", "name image");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not find a place.", 500),
    );
  }

  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided id.", 404),
    );
  }

  res.json({ place: serializeDoc(place) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId })
      .populate("creator", "name image")
      .sort({ createdAt: -1 });
  } catch (err) {
    return next(
      new HttpError("Fetching places failed, please try again later.", 500),
    );
  }

  res.json({ places: (places || []).map(serializeDoc) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422),
    );
  }

  if (!req.files || req.files.length === 0) {
    return next(
      new HttpError(
        "Please upload place media and include at least one image.",
        422,
      ),
    );
  }

  const coverImageFile = req.files.find((file) =>
    file.mimetype.startsWith("image/"),
  );
  if (!coverImageFile) {
    return next(
      new HttpError(
        "Please include at least one image so the place has a cover photo.",
        422,
      ),
    );
  }

  const { title, description, address, addressNotes, category, priceLevel } =
    req.body;
  const tags = parseTags(req.body.tags);

  let coordinates;
  try {
    coordinates = await geocodeAddress(address);
  } catch (error) {
    return next(error);
  }

  const uploadedMedia = mapUploadedMedia(req.files);

  const createdPlace = new Place({
    title,
    description,
    address,
    addressNotes: addressNotes || "",
    category: category || "other",
    priceLevel: priceLevel || "moderate",
    tags,
    location: coordinates,
    image: coverImageFile.path,
    media: uploadedMedia,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided id.", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(new HttpError("Creating place failed, please try again.", 500));
  }

  res.status(201).json({ place: serializeDoc(createdPlace) });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422),
    );
  }

  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update place.", 500),
    );
  }

  if (!place) {
    return next(
      new HttpError("Could not find place for the provided id.", 404),
    );
  }

  if (place.creator.toString() !== req.userData.userId) {
    return next(new HttpError("You are not allowed to edit this place.", 403));
  }

  const { title, description, address, addressNotes, category, priceLevel } =
    req.body;

  const tags = parseTags(req.body.tags);
  const removedMedia = parseRemovedMedia(req.body.removedMedia);
  const existingMedia = getExistingPlaceMedia(place);
  const keptMedia = existingMedia.filter(
    (item) => !removedMedia.includes(item.url),
  );
  const newMedia = mapUploadedMedia(req.files);
  const finalMedia = [...keptMedia, ...newMedia];

  if (finalMedia.length > 8) {
    cleanupFiles(newMedia.map((item) => item.url));
    return next(
      new HttpError("A place can contain at most 8 media files.", 422),
    );
  }

  const imageMedia = finalMedia.filter((item) => item.type === "image");

  if (imageMedia.length === 0) {
    cleanupFiles(newMedia.map((item) => item.url));
    return next(
      new HttpError(
        "A place must keep at least one image in its gallery.",
        422,
      ),
    );
  }

  let coordinates = place.location;
  if (address !== place.address) {
    try {
      coordinates = await geocodeAddress(address);
    } catch (error) {
      cleanupFiles(newMedia.map((item) => item.url));
      return next(error);
    }
  }

  const previousCoverStillExists = imageMedia.find(
    (item) => item.url === place.image,
  );
  const nextCoverImage = previousCoverStillExists
    ? previousCoverStillExists.url
    : imageMedia[0].url;

  place.title = title;
  place.description = description;
  place.address = address;
  place.addressNotes = addressNotes || "";
  place.category = category || "other";
  place.priceLevel = priceLevel || "moderate";
  place.tags = tags;
  place.location = coordinates;
  place.media = finalMedia;
  place.image = nextCoverImage;

  try {
    await place.save();
  } catch (err) {
    cleanupFiles(newMedia.map((item) => item.url));
    return next(
      new HttpError("Something went wrong, could not save updated place.", 500),
    );
  }

  cleanupFiles(removedMedia);

  res.status(200).json({ place: serializeDoc(place) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete place.", 500),
    );
  }

  if (!place) {
    return next(new HttpError("Could not find place for this id.", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to delete this place.", 403),
    );
  }

  let placeReviews = [];
  try {
    placeReviews = await Review.find({ place: placeId });
  } catch (err) {
    return next(
      new HttpError(
        "Something went wrong, could not delete place reviews.",
        500,
      ),
    );
  }

  const placeMediaPaths = (place.media || []).map((item) => item.url);
  const reviewImagePaths = placeReviews.flatMap(
    (review) => review.images || [],
  );

  const filePaths = Array.from(
    new Set(
      [place.image, ...placeMediaPaths, ...reviewImagePaths].filter(Boolean),
    ),
  );

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await Review.deleteMany({ place: placeId }, { session: sess });
    await place.deleteOne({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not delete place.", 500),
    );
  }

  cleanupFiles(filePaths);

  res.status(200).json({ message: "Deleted place." });
};

exports.getRecentPlaces = getRecentPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
