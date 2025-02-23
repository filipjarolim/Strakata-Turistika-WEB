'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import { Button } from '@/components/ui/button';
import { Play, StopCircle, MapIcon, RefreshCcw } from 'lucide-react';

// Dynamically load react-leaflet
const MapContainerWrapper = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayerWrapper = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const PolylineWrapper = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
const MarkerWrapper = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Constants
const MAP_STYLE = { height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden" };
const TILE_LAYERS = {
    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    touristic: "https://tile.opentopomap.org/{z}/{x}/{y}.png"
};
const POLYLINE_COLOR = "blue";
const POLYLINE_WEIGHT = 5;
const ZOOM_LEVEL = 15;

// Geolocation Handling
const getStoredLocation = () => {
    const savedLocation = localStorage.getItem("lastKnownLocation");
    return savedLocation ? JSON.parse(savedLocation) : null;
};

const GpsTracker: React.FC = () => {
    const [tracking, setTracking] = useState(false);
    const [positions, setPositions] = useState<[number, number][]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [touristicMode, setTouristicMode] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (!navigator.onLine) {
            setIsOffline(true);
            const cachedLocation = getStoredLocation();
            if (cachedLocation) {
                setMapCenter(cachedLocation);
            }
        } else {
            setIsOffline(false);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newLocation: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setMapCenter(newLocation);
                    localStorage.setItem("lastKnownLocation", JSON.stringify(newLocation));
                },
                (err) => console.error('Error retrieving position:', err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const startTracking = () => {
        setTracking(true);
    };

    const stopTracking = () => {
        setTracking(false);
    };

    const resetTracking = () => {
        setPositions([]);
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 w-full max-w-lg mx-auto border shadow-lg rounded-lg">
            {mapCenter && (
                <MapContainerWrapper
                    center={mapCenter}
                    zoom={ZOOM_LEVEL}
                    style={MAP_STYLE}
                >
                    <TileLayerWrapper
                        attribution='&copy; OpenStreetMap contributors'
                        url={touristicMode ? TILE_LAYERS.touristic : TILE_LAYERS.standard}
                    />
                    {positions.length > 0 && (
                        <PolylineWrapper positions={positions} color={POLYLINE_COLOR} weight={POLYLINE_WEIGHT} />
                    )}
                </MapContainerWrapper>
            )}

            <div className="text-center mt-4">
                <p className="text-lg font-bold text-gray-700">
                    {isOffline ? "Offline Mode: Last Known Location" : "Tracking Active"}
                </p>
            </div>

            <div className="flex gap-4 mt-4">
                {!tracking ? (
                    <Button onClick={startTracking} className="bg-green-500 text-white">
                        <Play className="mr-2" /> Start
                    </Button>
                ) : (
                    <Button onClick={stopTracking} className="bg-red-500 text-white">
                        <StopCircle className="mr-2" /> Stop
                    </Button>
                )}
                <Button onClick={() => setTouristicMode(!touristicMode)} className="bg-yellow-500 text-white">
                    <MapIcon className="mr-2" /> Touristic
                </Button>
                <Button onClick={resetTracking} className="bg-blue-500 text-white">
                    <RefreshCcw className="mr-2" /> Reset
                </Button>
            </div>
        </div>
    );
};

export default GpsTracker;
