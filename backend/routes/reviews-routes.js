const express = require("express");
const { check } = require("express-validator");

const reviewsControllers = require("../controllers/reviews-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/place/:pid", reviewsControllers.getReviewsByPlaceId);

router.use(checkAuth);

router.post(
  "/place/:pid",
  fileUpload.array("images", 4),
  [
    check("rating").isFloat({ min: 1, max: 5 }),
    check("comment").trim().isLength({ min: 10, max: 1000 }),
    check("visitDate").not().isEmpty().isISO8601(),
  ],
  reviewsControllers.createReview,
);

router.patch(
  "/:rid",
  fileUpload.array("images", 4),
  [
    check("rating").isFloat({ min: 1, max: 5 }),
    check("comment").trim().isLength({ min: 10, max: 1000 }),
    check("visitDate").not().isEmpty().isISO8601(),
  ],
  reviewsControllers.updateReview,
);

router.delete("/:rid", reviewsControllers.deleteReview);

module.exports = router;
