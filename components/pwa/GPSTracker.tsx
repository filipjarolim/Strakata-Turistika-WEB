"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { usePosition } from "use-position";
import { getDistance } from "geolib";

const GPSTracker = () => {
    const [distance, setDistance] = useState(0); // Total distance
    const [isTracking, setIsTracking] = useState(false); // Tracking status
    const [previousPosition, setPreviousPosition] = useState<{ latitude: number; longitude: number } | null>(null);

    const THRESHOLD = 5; // Minimum movement in meters to count as new distance
    const ACCURACY_LIMIT = 20; // Maximum acceptable accuracy in meters

    // Add PositionOptions
    const geoOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: Infinity,
        maximumAge: 0,
    };

    // Hook to use geolocation
    const { latitude, longitude, accuracy } = usePosition(isTracking, geoOptions)

    useEffect(() => {
        if (isTracking && latitude && longitude) {
            if (accuracy && accuracy <= ACCURACY_LIMIT) {
                if (previousPosition) {
                    // Calculate the distance since the last position
                    const newDistance = getDistance(
                        {
                            latitude: previousPosition.latitude,
                            longitude: previousPosition.longitude,
                        },
                        { latitude, longitude }
                    );

                    // Only update total distance if new distance exceeds the threshold
                    if (newDistance > THRESHOLD) {
                        setDistance((prev) => prev + newDistance);
                        setPreviousPosition({ latitude, longitude });
                    }
                } else {
                    // Set initial GPS position
                    setPreviousPosition({ latitude, longitude });
                }
            } else {
                console.warn("Poor accuracy: Skipping position update", accuracy);
            }
        }
    }, [latitude, longitude, accuracy, isTracking]);

    // Start tracking
    const startTracking = () => {
        setDistance(0);
        setPreviousPosition(null);
        setIsTracking(true);
    };

    // Stop tracking
    const stopTracking = () => setIsTracking(false);

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
                    </div>
                    <div className="mt-4 flex space-x-2">
                        <Button onClick={startTracking} variant="default" disabled={isTracking}>
                            Start Tracking
                        </Button>
                        <Button onClick={stopTracking} variant="secondary" disabled={!isTracking}>
                            Stop Tracking
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GPSTracker;