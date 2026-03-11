require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const reviewsRoutes = require("./routes/reviews-routes");
const collectionsRoutes = require("./routes/collections-routes");
const placeInsightsRoutes = require("./routes/place-insights-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(
  "/uploads/images",
  express.static(path.join(__dirname, "uploads/images")),
);
app.use(
  "/uploads/media",
  express.static(path.join(__dirname, "uploads/media")),
);
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );

  next();
});

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/place-insights", placeInsightsRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  if (req.files && req.files.length) {
    req.files.forEach((file) => {
      fs.unlink(file.path, (err) => {
        if (err) {
          console.log(err);
        }
      });
    });
  }

  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(process.env.DATABASE_URL)
  .then(() => {
    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
