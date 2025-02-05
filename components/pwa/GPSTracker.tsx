"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

const GPSTracker = () => {
    const [distance, setDistance] = useState(0) // Total distance
    const [isTracking, setIsTracking] = useState(false) // Whether tracking is active
    const [previousPosition, setPreviousPosition] = useState<GeolocationPosition | null>(null) // Last GPS position
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 }) // Accelerometer data
    const [rotationRate, setRotationRate] = useState({ alpha: 0, beta: 0, gamma: 0 }) // Gyroscope data

    const THRESHOLD = 5 // Minimum movement in meters to count as new distance
    const ACCURACY_LIMIT = 20 // Maximum acceptable accuracy in meters

    useEffect(() => {
        let watchId: number

        if (isTracking) {
            // Enable GPS tracking
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    // Check if position accuracy is good
                    if (position.coords.accuracy > ACCURACY_LIMIT) {
                        console.warn("Position ignored due to poor accuracy:", position.coords.accuracy)
                        return
                    }

                    // Calculate the distance if we have a previous position
                    if (previousPosition) {
                        const newDistance = calculateDistance(
                            previousPosition.coords.latitude,
                            previousPosition.coords.longitude,
                            position.coords.latitude,
                            position.coords.longitude
                        )

                        // Only update distance if newDistance exceeds the threshold
                        if (newDistance > THRESHOLD) {
                            setDistance((prevDistance) => prevDistance + newDistance)
                            setPreviousPosition(position)
                        }
                    } else {
                        // If no previous position, simply set the current position
                        setPreviousPosition(position)
                    }
                },
                (error) => console.error("Error with geolocation:", error),
                { enableHighAccuracy: true }
            )

            // Enable accelerometer and gyroscope tracking
            const handleMotion = (event: DeviceMotionEvent) => {
                if (event.acceleration) {
                    setAcceleration({
                        x: event.acceleration.x || 0,
                        y: event.acceleration.y || 0,
                        z: event.acceleration.z || 0,
                    })
                }
                if (event.rotationRate) {
                    setRotationRate({
                        alpha: event.rotationRate.alpha || 0,
                        beta: event.rotationRate.beta || 0,
                        gamma: event.rotationRate.gamma || 0,
                    })
                }
            }

            window.addEventListener("devicemotion", handleMotion)

            return () => {
                // Cleanup when tracking stops
                if (watchId) navigator.geolocation.clearWatch(watchId)
                window.removeEventListener("devicemotion", handleMotion)
            }
        }
    }, [isTracking, previousPosition])

    // Helper function to calculate the distance between two GPS coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const toRad = (value: number) => (value * Math.PI) / 180 // Convert degrees to radians
        const R = 6371e3 // Radius of the Earth in meters
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

    // Start tracking (reset distance and past positions)
    const startTracking = () => {
        setDistance(0) // Reset distance
        setPreviousPosition(null) // Clear previous position
        setIsTracking(true) // Begin tracking
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
                    <div className="mt-4 text-center">
                        <h2 className="text-lg">Accelerometer:</h2>
                        <p>X: {acceleration.x.toFixed(2)}, Y: {acceleration.y.toFixed(2)}, Z: {acceleration.z.toFixed(2)}</p>
                        <h2 className="text-lg mt-2">Gyroscope:</h2>
                        <p>α: {rotationRate.alpha.toFixed(2)}, β: {rotationRate.beta.toFixed(2)}, γ: {rotationRate.gamma.toFixed(2)}</p>
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