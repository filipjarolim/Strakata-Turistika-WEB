'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Play, StopCircle } from 'lucide-react';

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

    const MIN_DISTANCE_KM = 0.005; // Minimum distance threshold ≈ 5 meters
    const MIN_UPDATE_INTERVAL = 10000; // Minimum time threshold = 10 seconds

    useEffect(() => {
        // Get user’s initial position and set the map center
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

    const startTracking = () => {
        setTracking(true);
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                const currentTime = Date.now();

                setPositions((prev) => {
                    if (prev.length > 0) {
                        const [lastLat, lastLon] = prev[prev.length - 1];
                        const dist = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]);

                        // Check if the position update meets the time or distance threshold
                        if (
                            dist < MIN_DISTANCE_KM && // Less than 5 meters
                            (lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL) // Less than 10 seconds
                        ) {
                            return prev; // Skip this update
                        }
                    }

                    // Update last update time and add the new position
                    setLastUpdateTime(currentTime);
                    return [...prev, newPos];
                });
            },
            (err) => console.error(err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
        setWatchId(id);
    };

    const stopTracking = () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        setTracking(false);
        setWatchId(null);
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

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            {mapCenter ? (
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    className="w-full h-[400px] rounded-lg"
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {positions.length > 1 && (
                        <Polyline
                            positions={positions}
                            pathOptions={{ color: 'blue' }}
                        />
                    )}
                </MapContainer>
            ) : (
                <p>Loading map...</p> // Show a loading indicator while waiting for the initial position
            )}
            <div className="flex gap-2">
                <Button onClick={startTracking} disabled={tracking}>
                    <Play className="mr-2" /> Start Tracking
                </Button>
                <Button onClick={stopTracking} disabled={!tracking} variant="destructive">
                    <StopCircle className="mr-2" /> Stop Tracking
                </Button>
            </div>
            {positions.length > 1 && <p>Distance walked: {calculateDistance()} km</p>}
        </div>
    );
};

export default GpsTracker;