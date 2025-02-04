"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, MapPinOff } from "lucide-react"

const GPSTracker = () => {
    const [distance, setDistance] = useState(0)
    const [isTracking, setIsTracking] = useState(false)
    const [previousPosition, setPreviousPosition] = useState<GeolocationPosition | null>(null)

    useEffect(() => {
        let watchId: number

        if (isTracking) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    if (previousPosition) {
                        const newDistance = calculateDistance(
                            previousPosition.coords.latitude,
                            previousPosition.coords.longitude,
                            position.coords.latitude,
                            position.coords.longitude
                        )
                        setDistance((prevDistance) => prevDistance + newDistance)
                    }
                    setPreviousPosition(position)
                },
                (error) => console.error("Error with geolocation:", error),
                { enableHighAccuracy: true }
            )
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId)
        }
    }, [isTracking, previousPosition])

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const toRad = (value: number) => (value * Math.PI) / 180
        const R = 6371e3
        const φ1 = toRad(lat1)
        const φ2 = toRad(lat2)
        const Δφ = toRad(lat2 - lat1)
        const Δλ = toRad(lon2 - lon1)

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        return R * c
    }

    const startTracking = () => {
        setDistance(0)
        setPreviousPosition(null)
        setIsTracking(true)
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