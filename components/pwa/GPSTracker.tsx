"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

const GPSTracker = () => {
    const [distance, setDistance] = useState(0) // Total distance
    const [isTracking, setIsTracking] = useState(false) // Tracking active state
    const [previousPosition, setPreviousPosition] = useState<GeolocationPosition | null>(null) // Last GPS position

    const THRESHOLD = 5 // Minimum movement in meters to count as new distance
    const ACCURACY_LIMIT = 20 // Maximum acceptable accuracy in meters

    useEffect(() => {
        let watchId: number

        if (isTracking) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    // If position accuracy exceeds limit, ignore the update
                    if (position.coords.accuracy > ACCURACY_LIMIT) {
                        console.warn("Position ignored due to poor accuracy:", position.coords.accuracy)
                        return
                    }

                    // Calculate distance only if there's a valid previous position
                    if (previousPosition) {
                        const newDistance = calculateDistance(
                            previousPosition.coords.latitude,
                            previousPosition.coords.longitude,
                            position.coords.latitude,
                            position.coords.longitude
                        )

                        // Add the new distance only if it exceeds the threshold
                        if (newDistance > THRESHOLD) {
                            setDistance((prevDistance) => prevDistance + newDistance)
                            setPreviousPosition(position)
                        } else {
                            console.log("Ignored small movement:", newDistance)
                        }
                    } else {
                        // If this is the first position, save it without calculating
                        setPreviousPosition(position)
                    }
                },
                (error) => console.error("Error with geolocation:", error),
                { enableHighAccuracy: true }
            )
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
        }
    }, [isTracking, previousPosition])

    // Helper function to calculate distance between two latitude-longitude points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const toRad = (value: number) => (value * Math.PI) / 180 // Convert degrees to radians
        const R = 6371e3 // Radius of Earth in meters
        const φ1 = toRad(lat1)
        const φ2 = toRad(lat2)
        const Δφ = toRad(lat2 - lat1)
        const Δλ = toRad(lon2 - lon1)

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        return R * c // Distance in meters
    }

    // Start tracking
    const startTracking = () => {
        setDistance(0) // Reset distance
        setPreviousPosition(null) // Clear previous position
        setIsTracking(true) // Start tracking
    }

    // Stop tracking
    const stopTracking = () => setIsTracking(false)

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
    )
}

export default GPSTracker