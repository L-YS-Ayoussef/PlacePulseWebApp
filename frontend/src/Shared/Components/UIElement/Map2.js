import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapModal2 = (props) => {
    const { center, zoom } = props;
    const customIcon = new L.Icon({
        iconUrl: 'https://www.freepnglogos.com/uploads/pin-png/pin-northlands-college-admissions-1.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    });
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '320px', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
