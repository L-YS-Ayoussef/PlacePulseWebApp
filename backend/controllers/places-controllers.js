const fs = require("fs");
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require("mongoose");

const HttpError = require('../models/http-error');
const geocodeAddress = require("../util/location");
const Place = require('../models/place');
const User = require('../models/user');


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId); // Note -> when using the keyword [await] all the following code won't be executed till the awaited function be executed 
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a place.',
      500
    );
    return next(error);
  }
  // Another way for handling the query instead of [async...await] using the method [.exec] -> Here is an example -> 
  // const userQuery = User.findById(userId);
  // Without .exec(), you can await directly or use .then()
  // const user = await userQuery;
  // Or using .exec()
  // userQuery.exec((err, user) => {
  //   if (err) {
  //     console.error(err);
  // Handle error
  //   } else {
  //     console.log(user);
  // Do something with user
  //   }
  // });

  if (!place) {
    // Cause the code is asyncronous we won't use [throw]. instead, using -> [return next(error);]
    // throw new HttpError('Could not find a place for the provided id.', 404); // when throwing an error and there is no [try...catch], then the error-handling middleware defined in the [app.js] will be triggered and cause the response wasn't sent that [ res.json({ place }); ] wasn't executed, then this code will be executed when throwing the error -> [ res.status(error.code || 500); res.json({ message: error.message || 'An unknown error occurred!' }); ]

    const error = new HttpError(
      'Could not find a place for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true, transform: (doc, ret) => { delete ret._id; } }) }); // The [toObject()] method in Mongoose --> used to convert a Mongoose document into a plain JavaScript object. This method is particularly useful when you need to manipulate the data or send it over a network in a format that doesn't include Mongoose-specific properties or methods.
  // the key [transform] has a function to remove the field/key [_id] that won't be found in the resulting js object 
  // when setting the key [getters] to "true" -> we will have the key [id] not [_id] with a string value in the resulting js object as This is because Mongoose defines a getter for the _id field by default, which returns the hexadecimal string representation of the _id.
  // Explaing [Setting the key [getters]] -> 
  // In Mongoose, you can define getters on your schema properties for example ->
  // const userSchema = new mongoose.Schema({
  //   firstName: {
  //     type: String,
  //     required: true
  //   },
  //   lastName: {
  //     type: String,
  //     required: true
  //   },
  // Virtual property for full name using a getter
  //   fullName: {
  //     type: String,
  // Getter function to concatenate first and last name
  //     get: function () {
  //       return this.firstName + ' ' + this.lastName;
  //     }
  //   }
  // });

  // These getters allow you to define virtual properties or to modify the data before it's returned as part of the object. By default, Mongoose doesn't apply these getters when converting a document to a plain JavaScript object using toObject(). However, by passing { getters: true } as an option to toObject(), you instruct Mongoose to apply these getters during the conversion process.
  // Instead, you can set the key [getters] to [true] in case converting the mongoose document to a JS object when defining the schema -> here is an example of defining a schema ->
  // const placeSchema = new mongoose.Schema({
  // Other properties...
  //   title: String,
  // }, {
  //   toObject: { getters: true } // Ensure getters are applied when converting to JSON
  // });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      'Fetching places failed, please try again later',
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next( // the [next] -> accepts the error object whether from the class [Error](from node) or the custom one [HttpError] extened from the class [Error](from node)
      new HttpError('Could not find places for the provided user id.', 404)
    );
  }
  res.json({ places: places.map(place => place.toObject({ getters: true, transform: (doc, ret) => { delete ret._id; } })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { // using the method [isEmpty] provided by [express-validators] for checking the [validationResult]
    return (next(new HttpError('Invalid inputs passed, please check your data.', 422))); // cause here working with an async code, then using [next(error)] for throwing an error not [throw new HttpError]
  }

  const { title, description, address } = req.body;

  let coordinates;
  try {
    coordinates = await geocodeAddress(address);
  } catch (error) {
    return next(error);
  }

  // Creating the new Place model
  const createdPlace = new Place({
    // id: uuidv4(),  --> in the old version before using constructing DB
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator: req.userData.userId // here it is the id of the user got from the object [req.body] later in the authentication part will be changed that will be got from the session of this user creating the place 
  });

  // Getting the user 
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }
  //Checking if the user is not exist, later we won't need it that after getting the user Id from the session, we will be sure about this user he is exist 
  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  // Saving the created place and updating the user document to include the place id in the [places] field
  try {
    // here using [sessions & transactions] to ensure the two operations done together 
    const sess = await mongoose.startSession(); // Sessions: Sessions in Mongoose provide a way to group multiple database operations together within a transaction. This ensures that these operations are executed as a single unit of work.
    sess.startTransaction(); // Transactions: Transactions in MongoDB allow you to perform multiple operations on one or more collections atomically. This means either all operations succeed, or they all fail, ensuring data consistency.
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace); // Updating User's Places: You push the createdPlace into the user.places array. Since user.places is an array of ObjectIds referencing Place documents, Mongoose will automatically extract the _id field from createdPlace and push it into the user.places array. Only the _id field will be pushed because that's what is specified in the schema.
    await user.save({ session: sess });
    await sess.commitTransaction(); // Committing the Transaction: If all operations succeed, the transaction is committed, and the changes become permanent in the database.
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  // Another Way to create a place [using queries] 
  // try {
  //   const createdPlace = await Place.create({
  //     title,
  //     description,
  //     address,
  //     location: coordinates,
  //     image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg',
  //     creator
  //   });

  //   console.log("Place created:", createdPlace);
  // } catch (error) {
  //   console.error("Error creating place:", error);
  //   Handle error
  // }

  res.status(201).json({ place: createdPlace }); // the status code [201] -> the request was successfully fulfilled and resulted in one or possibly multiple new resources being created.
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Invalid inputs passed, please check your data.', 422);
    return next(error);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  // Ensuring that the creater of the place is the person trying to edit or delete this place
  if (place.creator.toString() !== req.userData.userId){
    const error = new HttpError(
      'You are not allowed to edit this place!',
      401 // UNAUTHORIZED -> you might be authenticated, but not authorized/allowed to do this action 
    );
    return next(error);
  }

  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true, transform: (doc, ret) => { delete ret._id; } }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  // finding the place and populating the field [creator] meaning that the field [creator] will be the user entire document created this place will be deleted
  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    // console.log(err);
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  // Checking if the place not exist 
  if (!place){
    const error = new HttpError(
      'Place not found.',
      404
    );
    return next(error);
  }

  if (place.creator._id.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this place!',
      401
    );
    return next(error);
  }

  const imagePath = place.image;
  
  // deleting the place and updating the user document to pull the place id from the places array of this user  
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    const result = await Place.deleteOne({ _id: placeId }); // [await place.remove();] -> the method [remove] is deprecated in mongoose recent versions
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not delete place.',
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, err => {
    console.log(err);
  });

  res.status(200).json({ message: 'Place deleted successfully.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
