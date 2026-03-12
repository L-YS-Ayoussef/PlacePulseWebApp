const express = require('express');
const { check } = require('express-validator');

const fileUpload = require("../middleware/file-upload");
const usersController = require('../controllers/users-controllers');

const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:uid", usersController.getUserById);
router.post(
  '/signup',
  fileUpload.single("image"),
  [
    check('name')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail() 
      .isEmail(),
    check('password').isLength({ min: 5 })
  ],
  usersController.signup
);

router.post('/login', usersController.login); 

router.use(checkAuth);
router.patch(
  "/:uid",
  fileUpload.single("image"),
  [check("name").not().isEmpty()],
  usersController.updateProfile,
);

module.exports = router;
