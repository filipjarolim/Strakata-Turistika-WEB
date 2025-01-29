import { useEffect } from "react";

export function useBackgroundTracking() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker.ready.then((registration) => {
            if ("SyncManager" in window) {
                registration.sync.register("background-tracking").catch((err) => console.error("Sync error:", err));
            }
        });

        if ("Notification" in window && Notification.permission === "granted") {
            setInterval(() => {
                new Notification("Tracking in Progress", {
                    body: "You have been tracking for XX minutes",
                });
            }, 60000); // Sends a notification every 60 seconds
        }
    }, []);
}