require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const HttpError = require('../models/http-error');
const User = require('../models/user');


const serializeUser = (user) =>
  user.toObject({
    getters: true,
    versionKey: false,
    transform: (doc, ret) => {
      delete ret.password;
      delete ret._id;
      return ret;
    },
});

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    return next(
      new HttpError("Fetching user failed, please try again later.", 500),
    );
  }

  if (!user) {
    return next(new HttpError("Could not find user for the provided id.", 404));
  }

  res.json({ user: serializeUser(user) });
};

const updateProfile = async (req, res, next) => {
  const userId = req.params.uid;

  if (req.userData.userId !== userId) {
    return next(
      new HttpError("You are not allowed to edit this profile.", 403),
    );
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422),
    );
  }

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return next(
      new HttpError("Updating profile failed, please try again later.", 500),
    );
  }

  if (!user) {
    return next(new HttpError("Could not find user for the provided id.", 404));
  }

  const oldImage = user.image;

  user.name = req.body.name || user.name;
  if (req.file) {
    user.image = req.file.path;
  }

  try {
    await user.save();
  } catch (err) {
    return next(new HttpError("Could not save updated profile.", 500));
  }

  if (req.file && oldImage && oldImage !== user.image) {
    fs.unlink(oldImage, (err) => {
      if (err) console.log(err);
    });
  }

  res.status(200).json({ user: serializeUser(user) });
};

// const getUsers = async (req, res, next) => {
//   let users;
//   try {
//     users = await User.find({}, '-password'); // adding "minus" before the field [password] that i don't want this field in the returned documents
//   } catch (err) {
//     const error = new HttpError(
//       'Fetching users failed, please try again later.',
//       500
//     );
//     return next(error);
//   }
//   res.json({ users: users.map(user => user.toObject({ getters: true, transform: (doc, ret) => { delete ret._id; } })) });
// };

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    ); // the status code 422 -> The server can't process your request, although it understands it.
  }
  const { name, email, password } = req.body;

  // Checking if the user already exists
  let existingUser
  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }
  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try{
    hashedPassword = await bcrypt.hash(password, 12); // the second parameter is the salt which influences the strength of hashing the password 
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again.',
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign( // the first parameter is the payload of the token which is the data will be encoded in the token and this can be a string or an object or a buffer, here is an object  
      { userId: createdUser.id, email: createdUser.email }, // here encoding an object carrying the userId and email and the entire serialization and encoding logic will be handled by the "jsonwebtoken" package   
      process.env.SECRET_KEY,
      { expiresIn: '1h' } // it is for more secuirty that in case the token is stolen(by knowing the private key), then there is a short time for the attacker to use it 
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  res.status(201).json({ userId: createdUser.id, email: createdUser.email, token: token });
};


const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email })
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  // if (!existingUser || existingUser.password !== hashedPassword) { // cause the password is hashed, then to do this step of checking the existence of the user and comparing the password, we can split this step into two steps -> one for checking the existence of the user and the other for comparing the password
  //   const error = new HttpError(
  //     'Invalid credentials, could not log you in.',
  //     401
  //   );
  //   return next(error);
  // } // the status code [401] -> Unauthorized

  // Step 1 -> checking the existence of the user 
  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403 // the status code "403" -> means it is forbidden to do this and it can be used when the user not authenticated due to the invalid credentials 
    );
    return next(error);
  }

  // Step 2 -> comparing the passwords 
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign( 
      { userId: existingUser.id, email: existingUser.email },
      process.env.SECRET_KEY,
      { expiresIn: '1h' } 
    );
  } catch (err) {
    const error = new HttpError(
      'Logining in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({ userId: existingUser.id, email: existingUser.email, token: token });
};

// exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.getUserById = getUserById;
exports.updateProfile = updateProfile;
