const express = require('express');
const { check } = require('express-validator');

const fileUpload = require("../middleware/file-upload");
const usersController = require('../controllers/users-controllers');

const router = express.Router();

router.get('/', usersController.getUsers);
router.post(
  '/signup',
  fileUpload.single("image"), // [fileUpload] -> is a group of middlewares, when calling the ".single" method, it is a specific middleware for accepting/recieving a single file, the parameter "image" passed to "fileUpload" is the key of the file recieved in the body json data got from the post request from the frontend 
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail() // Test@test.com => test@test.com
      .isEmail(),
    check('password').isLength({ min: 5 })
  ],
  usersController.signup
);
router.post('/login', usersController.login); // Note -> The login needs the method [POST] not [GET], that you get data from the login form and when submitting this form, the post request will be triggered not get 

module.exports = router;
