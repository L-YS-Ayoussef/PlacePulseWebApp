const express = require("express");
const { check } = require("express-validator");

const placesControllers = require("../controllers/places-controllers");
const checkAuth = require("../middleware/check-auth");
const mediaUpload = require("../middleware/media-upload");

const router = express.Router();

router.get("/", placesControllers.getRecentPlaces);
router.get("/user/:uid", placesControllers.getPlacesByUserId);
router.get("/:pid", placesControllers.getPlaceById);

router.use(checkAuth);

router.post(
  "/",
  mediaUpload.array("media", 8),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
    check("category").not().isEmpty(),
  ],
  placesControllers.createPlace,
);

router.patch(
  "/:pid",
  mediaUpload.array("media", 8),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
    check("category").not().isEmpty(),
  ],
  placesControllers.updatePlace,
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
