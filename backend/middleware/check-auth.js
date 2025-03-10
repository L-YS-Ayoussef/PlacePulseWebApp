require("dotenv").config();
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") { // before the "GET" request, there is "OPTIONS" request sent, then it must be handled 
    return next();
  }

  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Cameleon TOKEN', "Cameleon" -> is a convention will be included in the string representing the value of the key "Authorization" in the headers object 
    if (!token) {
      throw new Error('Authentication failed!');
    }
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY); // [decodedToken] -> is the object carrying the "userId" and "email" when creating the token
    req.userData = { userId: decodedToken.userId }; // as the [userId] is encoded in the token when created, after verifying the token and get the object "decodedToken" -> we can extract the "userId" from the decoded token
    next();
  } catch (err) {
    const error = new HttpError('Authentication failed!', 403);
    return next(error);
  }
};


// Note on using "tokens" VS. "Sessions" for Authentication -> 
  // 1) "tokens" -> when dealing with a SPA project(like "React") where the frontend is sperated from the backend 
  // 2) "Sessions" -> when rendeing the HTML and css files instead of using a framework for the frontend 