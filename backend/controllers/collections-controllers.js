require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const Collection = require("../models/collection");
const Place = require("../models/place");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const serializeDoc = (doc) =>
  doc.toObject({
    getters: true,
    versionKey: false,
    transform: (document, ret) => {
      delete ret._id;
      return ret;
    },
  });

const serializeCollectionSummary = (collection) => {
  const serialized = serializeDoc(collection);
  const placeIds = (serialized.places || []).map((place) =>
    typeof place === "object" ? place.id : `${place}`,
  );

  return {
    ...serialized,
    placeIds,
    placeCount: placeIds.length,
  };
};

const getCollectionsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  if (req.userData.userId !== userId) {
    return next(
      new HttpError("You are not allowed to view these collections.", 403),
    );
  }

  let collections;
  try {
    collections = await Collection.find({ owner: userId }).sort({
      createdAt: -1,
    });
  } catch (err) {
    return next(
      new HttpError(
        "Fetching collections failed, please try again later.",
        500,
      ),
    );
  }

  res.json({
    collections: (collections || []).map(serializeCollectionSummary),
  });
};

const getCollectionById = async (req, res, next) => {
  const collectionId = req.params.cid;

  let collection;
  try {
    collection = await Collection.findById(collectionId)
      .populate("owner", "name image")
      .populate({
        path: "places",
        populate: { path: "creator", select: "name image" },
      });
  } catch (err) {
    return next(
      new HttpError("Fetching collection failed, please try again later.", 500),
    );
  }

  if (!collection) {
    return next(new HttpError("Could not find collection for this id.", 404));
  }

  if (collection.owner.id !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to view this collection.", 403),
    );
  }

  res.json({ collection: serializeDoc(collection) });
};

const createCollection = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422),
    );
  }

  const ownerId = req.userData.userId;
  const name = (req.body.name || "").trim();
  const placeId = req.body.placeId;

  let existingCollection;
  try {
    existingCollection = await Collection.findOne({
      owner: ownerId,
      name: name,
    });
  } catch (err) {
    return next(
      new HttpError("Creating collection failed, please try again later.", 500),
    );
  }

  if (existingCollection) {
    return next(
      new HttpError("You already have a collection with this name.", 422),
    );
  }

  if (placeId) {
    let placeExists;
    try {
      placeExists = await Place.findById(placeId);
    } catch (err) {
      return next(new HttpError("Could not validate the selected place.", 500));
    }

    if (!placeExists) {
      return next(new HttpError("Could not find the selected place.", 404));
    }
  }

  const createdCollection = new Collection({
    name,
    owner: ownerId,
    places: placeId ? [placeId] : [],
    shareToken: uuidv4(),
    isPublic: false,
  });

  try {
    await createdCollection.save();
  } catch (err) {
    return next(
      new HttpError("Creating collection failed, please try again.", 500),
    );
  }

  res.status(201).json({
    collection: serializeCollectionSummary(createdCollection),
  });
};

const addPlaceToCollection = async (req, res, next) => {
  const collectionId = req.params.cid;
  const { placeId } = req.body;

  let collection;
  try {
    collection = await Collection.findById(collectionId);
  } catch (err) {
    return next(
      new HttpError(
        "Could not update collection, please try again later.",
        500,
      ),
    );
  }

  if (!collection) {
    return next(new HttpError("Could not find collection for this id.", 404));
  }

  if (collection.owner.toString() !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to edit this collection.", 403),
    );
  }

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Could not validate the selected place.", 500));
  }

  if (!place) {
    return next(new HttpError("Could not find the selected place.", 404));
  }

  const alreadySaved = collection.places.some(
    (savedPlaceId) => savedPlaceId.toString() === placeId,
  );

  if (!alreadySaved) {
    collection.places.push(placeId);
  }

  try {
    await collection.save();
  } catch (err) {
    return next(new HttpError("Could not save place to collection.", 500));
  }

  res.status(200).json({
    collection: serializeCollectionSummary(collection),
  });
};

const removePlaceFromCollection = async (req, res, next) => {
  const collectionId = req.params.cid;
  const placeId = req.params.pid;

  let collection;
  try {
    collection = await Collection.findById(collectionId);
  } catch (err) {
    return next(
      new HttpError(
        "Could not update collection, please try again later.",
        500,
      ),
    );
  }

  if (!collection) {
    return next(new HttpError("Could not find collection for this id.", 404));
  }

  if (collection.owner.toString() !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to edit this collection.", 403),
    );
  }

  collection.places = collection.places.filter(
    (savedPlaceId) => savedPlaceId.toString() !== placeId,
  );

  try {
    await collection.save();
  } catch (err) {
    return next(new HttpError("Could not remove place from collection.", 500));
  }

  res.status(200).json({
    collection: serializeCollectionSummary(collection),
  });
};

const shareCollection = async (req, res, next) => {
  const collectionId = req.params.cid;

  let collection;
  try {
    collection = await Collection.findById(collectionId);
  } catch (err) {
    return next(
      new HttpError("Could not share collection, please try again later.", 500),
    );
  }

  if (!collection) {
    return next(new HttpError("Could not find collection for this id.", 404));
  }

  if (collection.owner.toString() !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to share this collection.", 403),
    );
  }

  collection.isPublic = true;

  try {
    await collection.save();
  } catch (err) {
    return next(new HttpError("Could not share collection.", 500));
  }

  res.status(200).json({
    shareToken: collection.shareToken,
    shareUrl: `${FRONTEND_URL}/collections/shared/${collection.shareToken}`,
  });
};

const deleteCollection = async (req, res, next) => {
  const collectionId = req.params.cid;

  let collection;
  try {
    collection = await Collection.findById(collectionId);
  } catch (err) {
    return next(
      new HttpError(
        "Could not delete collection, please try again later.",
        500,
      ),
    );
  }

  if (!collection) {
    return next(new HttpError("Could not find collection for this id.", 404));
  }

  if (collection.owner.toString() !== req.userData.userId) {
    return next(
      new HttpError("You are not allowed to delete this collection.", 403),
    );
  }

  try {
    await collection.deleteOne();
  } catch (err) {
    return next(new HttpError("Could not delete collection.", 500));
  }

  res.status(200).json({ message: "Deleted collection." });
};

const getSharedCollectionByToken = async (req, res, next) => {
  const shareToken = req.params.shareToken;

  let collection;
  try {
    collection = await Collection.findOne({
      shareToken,
      isPublic: true,
    })
      .populate("owner", "name image")
      .populate({
        path: "places",
        populate: { path: "creator", select: "name image" },
      });
  } catch (err) {
    return next(
      new HttpError(
        "Could not fetch shared collection, please try again later.",
        500,
      ),
    );
  }

  if (!collection) {
    return next(
      new HttpError("Could not find a public collection for this link.", 404),
    );
  }

  res.json({ collection: serializeDoc(collection) });
};

exports.getCollectionsByUserId = getCollectionsByUserId;
exports.getCollectionById = getCollectionById;
exports.createCollection = createCollection;
exports.addPlaceToCollection = addPlaceToCollection;
exports.removePlaceFromCollection = removePlaceFromCollection;
exports.shareCollection = shareCollection;
exports.deleteCollection = deleteCollection;
exports.getSharedCollectionByToken = getSharedCollectionByToken;
