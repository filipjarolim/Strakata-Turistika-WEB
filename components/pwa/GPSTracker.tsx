"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Play, Soup, RefreshCw } from "lucide-react";
import { usePosition } from "use-position";
import { getDistance, getSpeed } from "geolib";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GPSTracker = () => {
    const [distance, setDistance] = useState(0);
    const [speed, setSpeed] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [previousPosition, setPreviousPosition] = useState<{ latitude: number; longitude: number } | null>(null);
    const [path, setPath] = useState<{ latitude: number; longitude: number }[]>([]);
    const [history, setHistory] = useState<{ distance: number; path: { latitude: number; longitude: number }[] }[]>([]);

    const THRESHOLD = 5;
    const ACCURACY_LIMIT = 20;

    const geoOptions = {
        enableHighAccuracy: true,
        timeout: Infinity,
        maximumAge: 0,
    };

    const { latitude, longitude, accuracy, timestamp } = usePosition(isTracking, geoOptions);

    useEffect(() => {
        if (isTracking && latitude && longitude) {
            if (accuracy && accuracy <= ACCURACY_LIMIT) {
                if (previousPosition) {
                    const newDistance = getDistance(
                        { latitude: previousPosition.latitude, longitude: previousPosition.longitude },
                        { latitude, longitude }
                    );
                    const newSpeed = getSpeed(
                        { latitude: previousPosition.latitude, longitude: previousPosition.longitude, time: timestamp },
                        { latitude, longitude, time: Date.now() }
                    );

                    if (newDistance > THRESHOLD) {
                        setDistance((prev) => prev + newDistance);
                        setSpeed(newSpeed);
                        setPreviousPosition({ latitude, longitude });
                        setPath((prev) => [...prev, { latitude, longitude }]);
                    }
                } else {
                    setPreviousPosition({ latitude, longitude });
                    setPath([{ latitude, longitude }]);
                }
            } else {
                console.warn("Poor accuracy: Skipping position update", accuracy);
            }
        }
    }, [latitude, longitude, accuracy, isTracking, timestamp]);

    const startTracking = () => {
        setDistance(0);
        setSpeed(0);
        setPreviousPosition(null);
        setPath([]);
        setIsTracking(true);
    };

    const stopTracking = () => {
        setIsTracking(false);
        setHistory((prev) => [...prev, { distance, path }]);
    };

    const resetTracker = () => {
        setDistance(0);
        setSpeed(0);
        setPreviousPosition(null);
        setPath([]);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>GPS Tracker</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-2">
                        <MapPin className="w-6 h-6 text-green-500" />
                        <h1 className="text-xl">Distance Walked: {distance.toFixed(2)} meters</h1>
                        <h1 className="text-xl">Speed: {speed.toFixed(2)} m/s</h1>
                    </div>
                    <div className="mt-4 flex space-x-2">
                        <Button onClick={startTracking} variant="default" disabled={isTracking}>
                            <Play className="mr-2" /> Start Tracking
                        </Button>
                        <Button onClick={stopTracking} variant="secondary" disabled={!isTracking}>
                            <Soup className="mr-2" /> Stop Tracking
                        </Button>
                        <Button onClick={resetTracker} variant="outline">
                            <RefreshCw className="mr-2" /> Reset
                        </Button>
                    </div>
                    {path.length > 0 && (
                        <MapContainer center={[path[0].latitude, path[0].longitude]} zoom={15} style={{ height: "400px", width: "100%" }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Polyline positions={path.map(p => [p.latitude, p.longitude])} pathOptions={{ color: 'blue' }} />
                            {path.map((p, index) => (
                                <Marker key={index} position={[p.latitude, p.longitude]}>
                                    <Popup>
                                        Point {index + 1}: [{p.latitude}, {p.longitude}]
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                    <div className="mt-4">
                        <h2 className="text-lg">History</h2>
                        <ul>
                            {history.map((entry, index) => (
                                <li key={index} className="mb-4">
                                    <h3>Walked {entry.distance.toFixed(2)} meters</h3>
                                    <MapContainer center={[entry.path[0].latitude, entry.path[0].longitude]} zoom={15} style={{ height: "200px", width: "100%" }}>
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Polyline positions={entry.path.map(p => [p.latitude, p.longitude])} pathOptions={{ color: 'blue' }} />
                                    </MapContainer>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GPSTracker;