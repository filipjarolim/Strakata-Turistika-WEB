self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activated");
    self.clients.claim();
});

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icons/icon-192x192.png",
    });
});

// Background Sync
self.addEventListener("sync", async (event) => {
    if (event.tag === "background-tracking") {
        event.waitUntil(trackAndSendLocation());
    }
});

async function trackAndSendLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const locationData = {
                lat: position.coords.latitude,
                lon: position.coords.longitude,
                timestamp: new Date().toISOString(),
            };

            console.log("Sending background location:", locationData);

            await fetch("/api/tracking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: "user_id_here", // Replace with actual user ID
                    location: locationData,
                }),
            });
        },
        (error) => console.error("Background tracking error:", error),
        { enableHighAccuracy: true }
    );
}
