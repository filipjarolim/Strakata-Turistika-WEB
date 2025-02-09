'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import { Button } from '@/components/ui/button';
import { Play, StopCircle, CheckCircle, MapIcon, RefreshCcw } from 'lucide-react';

// Dynamically load react-leaflet to avoid SSR issues
const MapContainerWrapper = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayerWrapper = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const PolylineWrapper = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
const MarkerWrapper = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

// Constants for customization
const MAP_STYLE = { height: "400px", width: "100%", borderRadius: "12px", overflow: "hidden" };
const TILE_LAYERS = {
    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    touristic: "https://tile.opentopomap.org/{z}/{x}/{y}.png"
};
const POLYLINE_COLOR = "blue";
const POLYLINE_WEIGHT = 5; // Thickness of the polyline
const ZOOM_LEVEL = 15;
const MIN_DISTANCE_KM = 0.005; // Minimum distance threshold (≈ 5 meters)
const MIN_UPDATE_INTERVAL = 10000; // Minimum update interval (10 seconds)

// Marker Icon Configuration
const currentPositionIcon = L.icon({
    iconUrl: "icons/dog_emoji.png", // Path provided
    iconSize: [50, 50], // Size of the marker
    iconAnchor: [25, 50], // Positioning of the marker (center bottom)
    className: "custom-marker" // Class for custom styling if needed
});

// Haversine formula to calculate the distance between two coordinates
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const toRad = (deg: number): number => deg * (Math.PI / 180);
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const GpsTracker: React.FC = () => {
    const [tracking, setTracking] = useState<boolean>(false);
    const [positions, setPositions] = useState<[number, number][]>([]);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [touristicMode, setTouristicMode] = useState<boolean>(false);
    const [startTime, setStartTime] = useState<number | null>(null); // Tracks the start time
    const [elapsedTime, setElapsedTime] = useState<number>(0); // Holds elapsed time in seconds
    const [completed, setCompleted] = useState<boolean>(false);

    useEffect(() => {
        // Initialize map with user’s current position
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setMapCenter([pos.coords.latitude, pos.coords.longitude]);
            },
            (err) => console.error('Error retrieving initial position:', err),
            { enableHighAccuracy: true }
        );

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [watchId]);

    useEffect(() => {
        // Update the elapsed time every second if tracking is active
        let timer: NodeJS.Timeout | null = null;
        if (tracking && startTime) {
            timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else if (!tracking) {
            clearInterval(timer!);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [tracking, startTime]);

    const startTracking = () => {
        setTracking(true);
        setCompleted(false);
        setStartTime(Date.now());
        setElapsedTime(0);
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                const currentTime = Date.now();

                setPositions((prev) => {
                    if (prev.length > 0) {
                        const [lastLat, lastLon] = prev[prev.length - 1];
                        const dist = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]);

                        // Skip updates if they don’t meet thresholds
                        if (
                            dist < MIN_DISTANCE_KM &&
                            (lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL)
                        ) {
                            return prev;
                        }
                    }

                    setLastUpdateTime(currentTime);
                    return [...prev, newPos];
                });
            },
            (err) => console.error('Error watching position:', err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
        setWatchId(id);
    };

    const stopTracking = () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        setTracking(false);
        setWatchId(null);
        setCompleted(true);
    };

    const resetTracking = () => {
        setPositions([]);
        setStartTime(null);
        setElapsedTime(0);
        setCompleted(false);
    };

    const calculateDistance = (): string => {
        let distance = 0;
        for (let i = 1; i < positions.length; i++) {
            const [lat1, lon1] = positions[i - 1];
            const [lat2, lon2] = positions[i];
            distance += haversineDistance(lat1, lon1, lat2, lon2);
        }
        return distance.toFixed(2);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const pad = (n: number) => (n < 10 ? `0${n}` : n);
        return `${pad(minutes)}:${pad(remainingSeconds)}`;
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4 w-full max-w-lg mx-auto border shadow-lg rounded-lg">
            {/* Map */}
            {mapCenter && (
                <MapContainerWrapper
                    center={mapCenter}
                    zoom={ZOOM_LEVEL}
                    style={MAP_STYLE}
                >
                    <TileLayerWrapper
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url={touristicMode ? TILE_LAYERS.touristic : TILE_LAYERS.standard}
                    />
                    {positions.length > 0 && (
                        <MarkerWrapper position={positions[positions.length - 1]} icon={currentPositionIcon} />
                    )}
                    {positions.length > 1 && (
                        <PolylineWrapper positions={positions} color={POLYLINE_COLOR} weight={POLYLINE_WEIGHT} />
                    )}
                </MapContainerWrapper>
            )}

            {/* Info Section */}
            <div className="text-center mt-4">
                <p className="text-lg font-bold text-gray-700">{`Distance: ${calculateDistance()} km`}</p>
                <p className="text-lg font-bold text-gray-700">{`Time: ${formatTime(elapsedTime)}`}</p>
            </div>

            {/* Action Buttons */}
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

            {/* Completion Message */}
            {completed && (
                <div className="text-center mt-6">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                    <h3 className="text-xl font-bold text-gray-800">Walk Completed!</h3>
                    <p className="text-lg text-gray-600">{`You walked ${calculateDistance()} km in ${formatTime(
                        elapsedTime
                    )}.`}</p>
                </div>
            )}
        </div>
    );
};

export default GpsTracker;