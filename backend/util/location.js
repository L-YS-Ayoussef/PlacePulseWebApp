const axios = require("axios");
const HttpError = require("../models/http-error");

async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "jsonv2",
          limit: 1,
          addressdetails: 1,
          email: process.env.NOMINATIM_CONTACT_EMAIL,
        },
        headers: {
          "User-Agent": `PlaceShare/1.0 (${process.env.NOMINATIM_CONTACT_EMAIL})`,
          "Accept-Language": "en",
          Accept: "application/json",
        },
        timeout: 10000,
      },
    );

    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) {
      throw new HttpError(
        "Could not find coordinates for the provided address. Please enter a more specific address.",
        422,
      );
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error(
      "Geocoding failed:",
      error.response?.status,
      error.response?.data || error.message,
    );

    if (error instanceof HttpError) {
      throw error;
    }

    if (error.response?.status === 429) {
      throw new HttpError(
        "Too many geocoding requests. Please try again shortly.",
        429,
      );
    }

    if (error.response?.status === 403) {
      throw new HttpError(
        "Geocoding request was rejected by the map service.",
        502,
      );
    }

    throw new HttpError(
      "Geocoding failed. Please try again later or use a more specific address.",
      500,
    );
  }
}

module.exports = geocodeAddress;
