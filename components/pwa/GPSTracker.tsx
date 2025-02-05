"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

// Average step length in meters (can be customized or calculated dynamically)
const STEP_LENGTH = 0.7

const GPSTracker = () => {
    const [distance, setDistance] = useState(0) // Total distance
    const [isTracking, setIsTracking] = useState(false) // Whether tracking is active
    const [previousPosition, setPreviousPosition] = useState<GeolocationPosition | null>(null) // Last GPS position
    const [stepCount, setStepCount] = useState(0) // Step counter
    const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 }) // Accelerometer data

    const ACCURACY_LIMIT = 20 // Maximum acceptable accuracy in meters

    // Filters accelerometer noise (keeps data smoother)
    const LOW_PASS_FILTER_ALPHA = 0.8

    // Stores previous acceleration for step detection
    let previousAccelerationMagnitude = 0
    let stepDetectionCooldown = false // Cooldown between step detections (avoids double counting)

    useEffect(() => {
        let watchId: number
        let motionListener: (event: DeviceMotionEvent) => void

        if (isTracking) {
            // Start tracking GPS
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (position.coords.accuracy > ACCURACY_LIMIT) {
                        console.warn("GPS Position ignored due to low accuracy:", position.coords.accuracy)
                        return
                    }

                    // Add distance based on GPS data
                    if (previousPosition) {
                        const gpsDistance = calculateDistance(
                            previousPosition.coords.latitude,
                            previousPosition.coords.longitude,
                            position.coords.latitude,
                            position.coords.longitude
                        )
                        setDistance((prevDistance) => prevDistance + gpsDistance)
                    }
                    setPreviousPosition(position)
                },
                (error) => console.error("Error with geolocation:", error),
                { enableHighAccuracy: true }
            )

            // Start accelerometer tracking for step detection
            motionListener = (event: DeviceMotionEvent) => {
                if (event.acceleration) {
                    // Apply a low-pass filter to reduce noise
                    const filteredAcceleration = {
                        x: LOW_PASS_FILTER_ALPHA * acceleration.x + (1 - LOW_PASS_FILTER_ALPHA) * (event.acceleration.x || 0),
                        y: LOW_PASS_FILTER_ALPHA * acceleration.y + (1 - LOW_PASS_FILTER_ALPHA) * (event.acceleration.y || 0),
                        z: LOW_PASS_FILTER_ALPHA * acceleration.z + (1 - LOW_PASS_FILTER_ALPHA) * (event.acceleration.z || 0),
                    }

                    setAcceleration(filteredAcceleration)

                    // Calculate the magnitude of the acceleration vector
                    const magnitude = Math.sqrt(
                        Math.pow(filteredAcceleration.x, 2) +
                        Math.pow(filteredAcceleration.y, 2) +
                        Math.pow(filteredAcceleration.z, 2)
                    )

                    // Detect potential steps by looking for peaks in acceleration
                    if (
                        magnitude > 1.2 &&
                        magnitude - previousAccelerationMagnitude > 0.5 &&
                        !stepDetectionCooldown
                    ) {
                        setStepCount((prevStepCount) => prevStepCount + 1)
                        setDistance((prevDistance) => prevDistance + STEP_LENGTH) // Add step length to distance
                        stepDetectionCooldown = true

                        // Cooldown to prevent double-counting of a single step
                        setTimeout(() => {
                            stepDetectionCooldown = false
                        }, 300) // Assuming ~300ms per step
                    }

                    previousAccelerationMagnitude = magnitude
                }
            }

            window.addEventListener("devicemotion", motionListener)
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
            if (motionListener) window.removeEventListener("devicemotion", motionListener)
        }
    }, [isTracking, previousPosition, acceleration])

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

    const startTracking = () => {
        setDistance(0) // Reset distance
        setStepCount(0) // Reset step count
        setPreviousPosition(null) // Clear previous position
        setIsTracking(true) // Begin tracking
    }

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
                    <div className="mt-2 flex space-x-4">
                        <div>
                            <h2 className="text-lg">Steps: {stepCount}</h2>
                        </div>
                        <div>
                            <h2 className="text-lg">Acceleration:</h2>
                            <p>X: {acceleration.x.toFixed(2)}</p>
                            <p>Y: {acceleration.y.toFixed(2)}</p>
                            <p>Z: {acceleration.z.toFixed(2)}</p>
                        </div>
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