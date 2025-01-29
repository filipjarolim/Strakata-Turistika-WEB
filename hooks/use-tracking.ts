import { useState, useEffect } from "react";

export function useTracking() {
    const [tracking, setTracking] = useState(false);
    const [locations, setLocations] = useState<{ lat: number; lon: number }[]>([]);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [distance, setDistance] = useState(0);

    useEffect(() => {
        let watchId: number | null = null;

        if (tracking) {
            setStartTime(new Date());
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLocation = {
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude,
                    };
                    setLocations((prev) => {
                        const updatedLocations = [...prev, newLocation];
                        if (prev.length > 1) {
                            setDistance((prevDist) => prevDist + calculateDistance(prev[prev.length - 1], newLocation));
                        }
                        return updatedLocations;
                    });
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        } else if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [tracking]);

    return { tracking, setTracking, locations, startTime, distance };
}

function calculateDistance(prev: { lat: number; lon: number }, curr: { lat: number; lon: number }) {
    const R = 6371; // Earth radius in km
    const dLat = (curr.lat - prev.lat) * (Math.PI / 180);
    const dLon = (curr.lon - prev.lon) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(prev.lat * (Math.PI / 180)) *
        Math.cos(curr.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}