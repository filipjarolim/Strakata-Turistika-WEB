"use client";
import { useState, useEffect } from "react";
import { useTracking } from "@/hooks/use-tracking";

export default function TrackingPage() {
    const { tracking, setTracking, locations, startTime, distance } = useTracking();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/service-worker.js")
                .then((registration) => console.log("Service Worker registered", registration))
                .catch((err) => console.error("Service Worker failed:", err));
        }

        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("Notifications enabled");
                }
            });
        }

        if ("SyncManager" in window && navigator.serviceWorker) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.sync.register("background-tracking");
            });
        }
    }, []);

    const stopTracking = async () => {
        if (!startTime) return;

        setSaving(true);
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);

        try {
            const response = await fetch("/api/tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: "user_id_here", // Replace with actual user ID
                    locations,
                    distance,
                    duration,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save tracking session");
            }

            console.log("Tracking session saved");
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
            setTracking(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold">GPS Tracking</h1>
            {tracking ? (
                <button onClick={stopTracking} className="bg-red-500 text-white px-4 py-2 rounded">
                    Stop Tracking
                </button>
            ) : (
                <button onClick={() => setTracking(true)} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Start Tracking
                </button>
            )}
            {tracking && <p>Tracking... Distance: {distance.toFixed(2)} km</p>}
            {saving && <p>Saving session...</p>}
        </div>
    );
}
