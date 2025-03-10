import React, { useRef, useEffect } from 'react';

import Map from 'ol/Map.js';
import OSM from 'ol/source/OSM.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {fromLonLat} from "ol/proj.js";
import Control from 'ol/control/Control.js';

import './Map.css';

const MapModal = props => {
    const mapRef = useRef(); // to create a reference using the hook [useRef]

    const { center, zoom } = props;

    useEffect(() => {
        const map = new Map({
            target: mapRef.current.id,
            layers: [
                new TileLayer({
                    source: new OSM()  // OpenStreetMap --> OSM
                })
            ],
            view: new View({
                center: fromLonLat([center.lng, center.lat]),
                zoom: zoom
            })
        });

        
        // // Create a custom attribution control
        // const customAttribution = new Control({
        //     element: document.createElement('div'),
        // });

        // customAttribution.element.innerHTML =
        //     '&copy; NodeSprint 2023'; // Replace with your own attribution information

        // // Add the custom attribution to the map
        // map.addControl(customAttribution);
    }, [center, zoom]);

    return (
        <div
            ref={mapRef}
            className={`map ${props.className}`}
            style={props.style}
            id="map"
        ></div>
    );
};

export default MapModal;