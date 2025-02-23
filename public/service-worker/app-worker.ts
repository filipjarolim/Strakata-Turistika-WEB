import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RouteHandler } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST?: (PrecacheEntry | string)[];
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            // Cache all navigation requests so that pages are available offline.
            matcher: ({ request }) => request.mode === "navigate",
            handler: "CacheFirst" as unknown as RouteHandler,
        },
        ...defaultCache,
    ],
    fallbacks: {
        entries: [
            {
                url: "/offline",
                matcher: ({ request }) => request.destination === "document",
            },
        ],
    },
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            vibrate: [100, 50, 100],
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: "2",
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener("notificationclick", (event) => {
    console.log("Notification click received.");
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return self.clients.openWindow("https://strakataturistika.vercel.app");
        })
    );
});
// File: public/service-worker/app-worker.ts

self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            (async () => {
                const cache = await caches.open("pages-cache");
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) return cachedResponse;
                try {
                    const fetchResponse = await fetch(event.request);
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                } catch (error) {
                    const offlineResponse = await caches.match("/offline");
                    if (offlineResponse) return offlineResponse;
                    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
                }
            })()
        );
    }
});