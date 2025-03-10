const express = require('express');
const { check } = require('express-validator');

const placesControllers = require('../controllers/places-controllers');
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get('/:pid', placesControllers.getPlaceById);
router.get('/user/:uid', placesControllers.getPlacesByUserId);

// Securing the next routes --> 
router.use(checkAuth); // all the routes next this are secured, then the user must be logged in to access these routes 

router.post(
  '/',
  fileUpload.single("image"),
  [
    check('title') // In this case, check('title') specifies that the validation rules following it will apply to the title field in the request body [req.body]
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address')
      .not()
      .isEmpty()
  ],
  placesControllers.createPlace
);
router.patch(
  '/:pid',
  [
    check('title')
      .not()
      .isEmpty(),
    check('description').isLength({ min: 5 })
  ],
  placesControllers.updatePlace
);
router.delete('/:pid', placesControllers.deletePlace);

module.exports = router;
