const axios = require('axios');
const HttpError = require('../models/http-error');

async function geocodeAddress(address) {
    try {
        const encodedAddress = encodeURIComponent(address);
        const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;

        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            return { lat: lat, lng: lon };
        } else {
            throw new HttpError('No results found for the given address', 404);
        }
    } catch (error) {
        throw new HttpError('An error occured', 500);
    }
}

module.exports = geocodeAddress;

// OpenStreetMap Nominatim API. OpenStreetMap (OSM) is a collaborative mapping project that provides free and open geographic data.