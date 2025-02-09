'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Play, StopCircle } from 'lucide-react';

interface Position {
    latitude: number;
    longitude: number;
}

const GpsTracker: React.FC = () => {
    const [tracking, setTracking] = useState<boolean>(false);
    const [positions, setPositions] = useState<[number, number][]>([]);
    const [watchId, setWatchId] = useState<number | null>(null);

    useEffect(() => {
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [watchId]);

    const startTracking = () => {
        setTracking(true);
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setPositions((prev) => [...prev, [pos.coords.latitude, pos.coords.longitude]]);
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
            const R = 6371; // Radius of Earth in km
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance += R * c;
        }
        return distance.toFixed(2);
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <MapContainer        center={[50, 14] as [number, number]}
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