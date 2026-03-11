const express = require("express");
const { check } = require("express-validator");

const placeInsightsControllers = require("../controllers/place-insights-controllers");

const router = express.Router();

router.get("/place/:pid", placeInsightsControllers.getPlaceInsightByPlaceId);

router.post(
  "/place/:pid/ask",
  [check("question").trim().not().isEmpty().isLength({ min: 3, max: 250 })],
  placeInsightsControllers.askQuestionAboutPlace,
);

module.exports = router;
