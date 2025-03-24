import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RouteHandler, Strategy, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

// List of pages to cache automatically - must include all critical pages for the app
const PAGES_TO_CACHE = [
    "/", 
    "/playground", 
    "/pravidla", 
    "/vysledky", 
    "/offline",
    "/login",
    "/profile"
]; 

// Critical assets to cache for offline functionality
const CRITICAL_ASSETS = [
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/icons/dog_emoji.png",
    "/manifest.json",
    "/favicon.ico"
];

// Define caching strategies with type assertion
const runtimeCachingOptions = [
    ...defaultCache,
    {
        urlPattern: /^https:\/\/(?:tile\.openstreetmap\.org|server\.arcgisonline\.com|tile\.opentopomap\.org)/i,
        handler: "CacheFirst" as any,
        options: {
            cacheName: "map-tiles-cache",
            expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
            cacheableResponse: {
                statuses: [0, 200],
            },
        },
    },
    {
        urlPattern: /\/api\//,
        handler: "NetworkFirst" as any,
        options: {
            cacheName: "api-cache",
            expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 1 day
            },
            networkTimeoutSeconds: 3,
        },
    },
    {
        urlPattern: ({ request }: { request: Request }) => 
            request.destination === "style" || 
            request.destination === "script" || 
            request.destination === "font" ||
            request.destination === "image",
        handler: "StaleWhileRevalidate" as any,
        options: {
            cacheName: "static-assets",
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
        },
    },
] as any;

// Initialize Serwist
const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: runtimeCachingOptions,
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

// Cache for dynamic data like GPS positions
const DYNAMIC_CACHE_NAME = "dynamic-app-data-v1";

// Define interfaces for the data we're storing
interface LocationData {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
}

interface TrackData {
    season: number;
    image: string | null;
    distance: string;
    elapsedTime: number;
    averageSpeed: string;
    fullName: string;
    maxSpeed: string;
    totalAscent: string;
    totalDescent: string;
    timestamp: number;
    positions: [number, number][];
}

// Install event - cache critical pages and assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            // Cache all important pages
            const pagesToCache = PAGES_TO_CACHE.map(page => 
                fetch(new Request(page, { cache: "reload" }))
                    .then(response => {
                        if (response.status === 200) {
                            return cache.put(page, response);
                        }
                    })
                    .catch(error => console.error(`Failed to cache page: ${page}`, error))
            );
            
            // Cache critical assets
            const assetsToCahe = CRITICAL_ASSETS.map(asset => 
                fetch(new Request(asset, { cache: "reload" }))
                    .then(response => {
                        if (response.status === 200) {
                            return cache.put(asset, response);
                        }
                    })
                    .catch(error => console.error(`Failed to cache asset: ${asset}`, error))
            );
            
            return Promise.all([...pagesToCache, ...assetsToCahe]);
        })
    );
});

// Additional fetch handler for GPS-specific data
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and cross-origin requests
    if (request.method !== "GET" || 
        (!request.url.startsWith(self.location.origin) && 
         !url.hostname.includes("tile.openstreetmap.org") && 
         !url.hostname.includes("server.arcgisonline.com"))) {
        return;
    }

    // Handle last known location data (specially cached for offline use)
    if (url.pathname === '/api/location' || url.pathname.includes('/lastKnownLocation')) {
        event.respondWith(handleLocationData(request));
        return;
    }

    // Let Serwist handle other requests
});

// Special handler for location data
async function handleLocationData(request: Request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Clone the response before using it
        const responseToCache = networkResponse.clone();
        
        // Cache the fresh data
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        await cache.put(request, responseToCache);
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache if network fails
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cached data, return empty but valid JSON
        return new Response(JSON.stringify({
            offline: true,
            cached: false,
            message: "No location data available offline"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle sync events for offline data submission
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-gps-data') {
        event.waitUntil(syncGpsData());
    }
});

// Sync GPS data when coming back online
async function syncGpsData() {
    try {
        // Check if we have cached GPS data to sync
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const pendingDataRequest = new Request('/pending-gps-data');
        const response = await cache.match(pendingDataRequest);
        
        if (response) {
            const pendingData = await response.json() as TrackData[];
            
            // Send the data to the server
            if (pendingData && pendingData.length > 0) {
                const serverResponse = await fetch('/api/saveTrack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingData),
                });
                
                if (serverResponse.ok) {
                    // Clear the pending data after successful sync
                    await cache.delete(pendingDataRequest);
                    
                    // Notify clients
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => {
                        client.postMessage({
                            type: "SYNC_COMPLETED",
                            success: true
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error syncing GPS data:', error);
    }
}

// Create a scheduled task to periodically check and clean up cache
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_CLEANUP') {
        event.waitUntil(cleanupCaches());
    }
    
    if (event.data && event.data.type === 'SAVE_FOR_OFFLINE') {
        const { url, data } = event.data;
        if (url && data) {
            event.waitUntil(cacheDataForOffline(url, data));
        }
    }
});

// Function to clean up old caches
async function cleanupCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name !== DYNAMIC_CACHE_NAME && 
        name !== "map-tiles-cache" && 
        name !== "static-assets" && 
        name !== "api-cache"
    );
    
    await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
}

// Save location data specifically for offline use
async function cacheDataForOffline(url: string, data: LocationData | TrackData) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(new Request(url), response);
}

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
            return self.clients.openWindow('/playground');
        })
    );
});

// Store cached pages in IndexedDB for the frontend component
function updateCachedPages() {
    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
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
