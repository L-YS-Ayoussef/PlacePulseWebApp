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

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }
  const { name, email, password } = req.body;

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
    hashedPassword = await bcrypt.hash(password, 12);
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
    token = jwt.sign( 
      { userId: createdUser.id, email: createdUser.email }, 
      process.env.SECRET_KEY,
      { expiresIn: '1h' }
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

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

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

exports.signup = signup;
exports.login = login;
exports.getUserById = getUserById;
exports.updateProfile = updateProfile;
