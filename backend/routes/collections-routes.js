const express = require("express");
const { check } = require("express-validator");

const collectionsControllers = require("../controllers/collections-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get(
  "/shared/:shareToken",
  collectionsControllers.getSharedCollectionByToken,
);

router.use(checkAuth);

router.get("/user/:uid", collectionsControllers.getCollectionsByUserId);
router.get("/:cid", collectionsControllers.getCollectionById);

router.post(
  "/",
  [check("name").trim().not().isEmpty().isLength({ max: 60 })],
  collectionsControllers.createCollection,
);

router.post("/:cid/places", collectionsControllers.addPlaceToCollection);

router.delete("/:cid", collectionsControllers.deleteCollection);

router.delete(
  "/:cid/places/:pid",
  collectionsControllers.removePlaceFromCollection,
);

router.patch("/:cid/share", collectionsControllers.shareCollection);

module.exports = router;
