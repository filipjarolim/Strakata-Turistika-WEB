import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

// Define pages to be preloaded for offline use
const PRECACHE_PAGES = [
    '/',
    '/about',
    '/dashboard',
    '/offline',
    "/playground"
];

// Define additional assets to be cached
const PRECACHE_ASSETS = [
    '/app/globals.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

const serwist = new Serwist({
    precacheEntries: [...(self.__SW_MANIFEST || []), ...PRECACHE_PAGES, ...PRECACHE_ASSETS],
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

serwist.addEventListeners();

// Listen for install event to precache important pages and assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('pwa-static-v1').then((cache) => {
            return cache.addAll([...PRECACHE_PAGES, ...PRECACHE_ASSETS]);
        })
    );
});

// Handle fetch events: serve from cache first, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            } else {
                return fetch(event.request).catch(() => caches.match('/offline').then((offlineResponse) => {
                    if (offlineResponse) {
                        return offlineResponse;
                    } else {
                        return new Response('Offline page not found', { status: 404 });
                    }
                }));
            }
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

// Handle notification clicks
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
