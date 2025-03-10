import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapModal2 = (props) => {
    const { center, zoom } = props;
    const customIcon = new L.Icon({
        iconUrl: 'https://www.freepnglogos.com/uploads/pin-png/pin-northlands-college-admissions-1.png', // Replace with the URL to your custom icon image
        iconSize: [32, 32], // [width, height] of the icon
        iconAnchor: [16, 32], // [horizontal center, bottom] point of the icon which corresponds to marker's location
        popupAnchor: [0, -32], // [horizontal center, top] point of the popup related to the icon's anchor
    });
    return (
        <MapContainer
            center={center} // [latitude, longitude] array for the map center
            zoom={zoom} // Zoom level (integer value)
            style={{ height: '320px', width: '100%' }} // Map container size
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" // Use OpenStreetMap tiles
            />
            <Marker position={[center.lat, center.lng]} icon={customIcon}>
                <Popup>
                    A sample marker at Lat: {center.lat}, Lng: {center.lng}.
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default MapModal2;
