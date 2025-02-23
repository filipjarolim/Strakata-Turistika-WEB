import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

// List of pages to cache automatically
const PAGES_TO_CACHE = ["/", "/playground", "/pravidla", "/vysledky"]; // Add your desired pages here

const CACHE_NAME = "dynamic-page-cache-v1";

// Initialize Serwist
const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
        entries: [
            {
                url: '/offline',
                matcher({ request }) {
                    return request.destination === 'document';
                },
            },
        ],
    },
});

// Add event listeners for Serwist
serwist.addEventListeners();

// Cache pages when they are visited
self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request).then((networkResponse) => {
                if (PAGES_TO_CACHE.includes(new URL(request.url).pathname)) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        updateCachedPages();
                        return networkResponse;
                    });
                }
                return networkResponse;
            });
        })
    );
});

// Handle push notifications
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return self.clients.openWindow('https://strakataturistika.vercel.app');
        })
    );
});

// Store cached pages in IndexedDB for the frontend component
function updateCachedPages() {
    caches.open(CACHE_NAME).then(cache => {
        cache.keys().then(keys => {
            const cachedUrls = keys.map(request => request.url);
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: "UPDATE_CACHED_PAGES", pages: cachedUrls });
                });
            });
        });
    });
}
