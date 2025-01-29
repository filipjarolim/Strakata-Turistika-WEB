"use client";
import { useEffect } from "react";

export default function ServiceWorker() {
    useEffect(() => {
        // Register the Service Worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/service-worker.js")
                .then((registration) => console.log("Service Worker registered", registration))
                .catch((err) => console.error("Service Worker failed:", err));
        }

        // Request Notification Permission
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    console.log("Notifications enabled");
                }
            });
        }

        // Register Background Sync
        if ("SyncManager" in window && navigator.serviceWorker) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.sync.register("background-tracking").catch((err) => console.error("Sync error:", err));
            });
        }
    }, []);

    return null;
}
