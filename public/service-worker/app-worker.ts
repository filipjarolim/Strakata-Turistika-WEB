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
        handler: "CacheFirst",
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
        handler: "NetworkFirst",
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
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "static-assets",
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
        },
    },
] as RuntimeCaching[];

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
// Add specialized cache for API responses
const API_CACHE_NAME = "api-responses-v1";
// Add results data cache with longer TTL
const RESULTS_CACHE_NAME = "results-data-v1";

// Define cache TTLs (in milliseconds)
const API_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RESULTS_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const SEASONS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours - seasons rarely change

// Network condition monitoring
let isOffline = false;
let slowConnection = false;
let lastNetworkCheck = 0;
const NETWORK_CHECK_INTERVAL = 30 * 1000; // 30 seconds

// Check network conditions
async function checkNetworkConditions() {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - lastNetworkCheck < NETWORK_CHECK_INTERVAL) {
        return { isOffline, slowConnection };
    }
    
    lastNetworkCheck = now;
    
    try {
        // Try to fetch a small resource to test connectivity
        const startTime = performance.now();
        const response = await fetch('/api/ping', { 
            method: 'HEAD',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });
        const endTime = performance.now();
        
        // Calculate network latency
        const latency = endTime - startTime;
        
        // Update connection status
        isOffline = false;
        slowConnection = latency > 2000; // Consider slow if > 2 seconds
        
        return { isOffline, slowConnection, latency };
    } catch (error) {
        // Fetch failed, likely offline
        isOffline = true;
        slowConnection = true;
        return { isOffline, slowConnection };
    }
}

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

// Add timestamps to cache entries
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

// Track last cache refresh times for different API endpoints
const lastRefreshTimes = new Map<string, number>();

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
    
    // Handle API results data with special caching
    if (url.pathname.startsWith('/api/results/') || url.pathname === '/api/results') {
        event.respondWith(handleApiResultsRequest(request));
        return;
    }
    
    // Handle seasons data with longer caching
    if (url.pathname === '/api/seasons') {
        event.respondWith(handleSeasonsRequest(request));
        return;
    }
    
    // Handle user results with personal data caching
    if (url.pathname === '/api/user/results' || url.pathname.startsWith('/api/user/results/')) {
        event.respondWith(handleUserResultsRequest(request));
        return;
    }

    // Special handling for the playground route when refreshing
    if (url.pathname.includes('/playground')) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached response if we have one
                    return cachedResponse;
                }
                
                return fetch(request).catch(error => {
                    // If offline and no cached response, try to return the cached playground page
                    return caches.match('/playground').then(cachedPlayground => {
                        // Return either the cached playground page or a fallback
                        return cachedPlayground || 
                            new Response('Offline - Please try again when online', {
                                status: 503,
                                headers: { 'Content-Type': 'text/html' }
                            });
                    });
                });
            })
        );
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

    // Add handlers for persistent notifications
    if (event.data && event.data.type === 'CREATE_PERSISTENT_NOTIFICATION') {
        event.waitUntil(
            self.registration.showNotification(
                event.data.data.title,
                {
                    body: event.data.data.body,
                    icon: event.data.data.icon || '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                    tag: event.data.data.tag,
                    requireInteraction: true,
                    data: {
                        url: '/playground',
                        trackingActive: true
                    }
                } as any
            )
        );
    }

    if (event.data && event.data.type === 'UPDATE_PERSISTENT_NOTIFICATION') {
        event.waitUntil(
            self.registration.getNotifications({ tag: event.data.data.tag })
                .then(notifications => {
                    if (notifications.length > 0) {
                        // Close the old notification
                        notifications.forEach(notification => notification.close());
                        
                        // Show a new one with updated data
                        return self.registration.showNotification(
                            event.data.data.title,
                            {
                                body: event.data.data.body,
                                icon: event.data.data.icon || '/icons/icon-192x192.png',
                                badge: '/icons/icon-192x192.png',
                                tag: event.data.data.tag,
                                requireInteraction: true,
                                data: {
                                    url: '/playground',
                                    trackingActive: true
                                }
                            } as any
                        );
                    }
                })
        );
    }
    
    if (event.data && event.data.type === 'CLOSE_PERSISTENT_NOTIFICATION') {
        event.waitUntil(
            self.registration.getNotifications({ tag: event.data.data.tag })
                .then(notifications => {
                    notifications.forEach(notification => notification.close());
                })
        );
    }

    if (event.data && event.data.type === 'REQUEST_CACHED_ENDPOINTS') {
        event.waitUntil(reportCachedApiEndpoints());
    }
    
    // Handler for reporting all cached pages
    if (event.data && event.data.type === 'REQUEST_CACHED_PAGES') {
        event.waitUntil(reportAllCachedPages());
    }
    
    // Handler for caching critical pages
    if (event.data && event.data.type === 'CACHE_ALL_PAGES') {
        const pages = event.data.pages || [];
        event.waitUntil(cacheMultiplePages(pages).then(() => {
            // Notify clients that caching is complete
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ 
                        type: "CACHE_COMPLETE",
                        success: true
                    });
                });
            });
        }));
    }
    
    // Handler for clearing all caches
    if (event.data && event.data.type === 'CLEAR_ALL_CACHE') {
        event.waitUntil(clearAllCaches().then(() => {
            // Notify clients that cache clearing is complete
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ 
                        type: "CACHE_CLEARED",
                        success: true
                    });
                });
            });
        }));
    }
    
    // Handler for network status changes
    if (event.data && event.data.type === 'NETWORK_STATUS_CHANGE') {
        const isOnline = event.data.isOnline;
        // Sync data when coming back online
        if (isOnline) {
            event.waitUntil(syncGpsData());
        }
    }
});

// Function to clean up old caches
async function cleanupCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name !== DYNAMIC_CACHE_NAME && 
        name !== API_CACHE_NAME &&
        name !== RESULTS_CACHE_NAME &&
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
    
    // Check if this is our tracking notification
    if (event.notification.data && event.notification.data.trackingActive) {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    // If we have an existing window, focus it
                    for (const client of clientList) {
                        if (client.url.includes('/playground') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Otherwise, open a new window
                    return self.clients.openWindow('/playground');
                })
        );
        return;
    }
    
    // Default notification behavior (for non-tracking notifications)
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
    reportAllCachedPages()
        .then(() => console.log('Updated cached pages list'))
        .catch(err => console.error('Failed to update cached pages:', err));
}

// Report cached API endpoints to frontend
async function reportCachedApiEndpoints() {
    try {
        // Get all cached API endpoints
        const apiCache = await caches.open(API_CACHE_NAME);
        const resultsCache = await caches.open(RESULTS_CACHE_NAME);
        
        const apiKeys = await apiCache.keys();
        const resultsKeys = await resultsCache.keys();
        
        // Combine all keys
        const allKeys = [...apiKeys, ...resultsKeys];
        
        // Filter to only include API endpoints
        const apiEndpoints = allKeys
            .map(request => request.url)
            .filter(url => url.includes('/api/'));
        
        // Report to all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ 
                type: "UPDATE_CACHED_API_ENDPOINTS", 
                endpoints: apiEndpoints,
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error("Error reporting cached API endpoints:", error);
    }
}

// Add periodic cache reporting (every 5 minutes)
setInterval(reportCachedApiEndpoints, 5 * 60 * 1000);

// Handler for seasons data (rarely changes, can be cached longer)
async function handleSeasonsRequest(request: Request) {
    const cacheKey = request.url;
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Check if cached response exists and is still valid
    if (cachedResponse) {
        const cachedData = await cachedResponse.clone().json();
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < SEASONS_CACHE_TTL) {
            return cachedResponse;
        }
    }
    
    try {
        // Fetch fresh data from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const data = await networkResponse.clone().json();
            
            // Add timestamp to the data
            const enhancedData = {
                ...data,
                timestamp: Date.now()
            };
            
            // Cache the enhanced response
            const enhancedResponse = new Response(JSON.stringify(enhancedData), {
                headers: new Headers(networkResponse.headers)
            });
            
            await cache.put(request, enhancedResponse.clone());
            
            // Update last refresh time
            lastRefreshTimes.set(cacheKey, Date.now());
            
            return networkResponse;
        }
        
        throw new Error(`Network response was not ok: ${networkResponse.status}`);
    } catch (error) {
        console.error(`Failed to fetch seasons data: ${error}`);
        
        // Return cached response if network request fails
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cached data, return empty but valid response
        return new Response(JSON.stringify({
            offline: true,
            cached: false,
            message: "No seasons data available offline"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handler for API results data
async function handleApiResultsRequest(request: Request) {
    const cache = await caches.open(RESULTS_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Check if cached response exists and is still valid
    if (cachedResponse) {
        const cachedData = await cachedResponse.clone().json();
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < RESULTS_CACHE_TTL) {
            // Return cached data, but also fetch new data in background to update cache
            // if it's been more than 5 minutes since last refresh
            const cacheKey = request.url;
            const lastRefresh = lastRefreshTimes.get(cacheKey) || 0;
            
            if (Date.now() - lastRefresh > API_CACHE_TTL) {
                // Background refresh cache
                fetch(request).then(async (response) => {
                    if (response.ok) {
                        const freshData = await response.clone().json();
                        
                        // Add timestamp to the data
                        const enhancedData = {
                            ...freshData,
                            timestamp: Date.now()
                        };
                        
                        // Cache the enhanced response
                        const enhancedResponse = new Response(JSON.stringify(enhancedData), {
                            headers: new Headers(response.headers)
                        });
                        
                        await cache.put(request, enhancedResponse);
                        
                        // Update last refresh time
                        lastRefreshTimes.set(cacheKey, Date.now());
                    }
                }).catch(err => {
                    console.warn('Background refresh failed:', err);
                });
            }
            
            return cachedResponse;
        }
    }
    
    try {
        // Fetch fresh data from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const data = await networkResponse.clone().json();
            
            // Add timestamp to the data
            const enhancedData = {
                ...data,
                timestamp: Date.now()
            };
            
            // Cache the enhanced response
            const enhancedResponse = new Response(JSON.stringify(enhancedData), {
                headers: new Headers(networkResponse.headers)
            });
            
            await cache.put(request, enhancedResponse.clone());
            
            // Update last refresh time
            lastRefreshTimes.set(request.url, Date.now());
            
            return networkResponse;
        }
        
        throw new Error(`Network response was not ok: ${networkResponse.status}`);
    } catch (error) {
        console.error(`Failed to fetch results data: ${error}`);
        
        // Return cached response if network request fails
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cached data, return empty but valid JSON
        return new Response(JSON.stringify({
            offline: true,
            cached: false,
            message: "No results data available offline"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handler for user-specific results (with privacy considerations)
async function handleUserResultsRequest(request: Request) {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // For user-specific data, we use a shorter TTL to ensure data freshness
    if (cachedResponse) {
        const cachedData = await cachedResponse.clone().json();
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < API_CACHE_TTL) {
            return cachedResponse;
        }
    }
    
    try {
        // Fetch fresh data from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const data = await networkResponse.clone().json();
            
            // Add timestamp to the data
            const enhancedData = {
                ...data,
                timestamp: Date.now()
            };
            
            // Cache the enhanced response
            const enhancedResponse = new Response(JSON.stringify(enhancedData), {
                headers: new Headers(networkResponse.headers)
            });
            
            await cache.put(request, enhancedResponse.clone());
            
            return networkResponse;
        }
        
        throw new Error(`Network response was not ok: ${networkResponse.status}`);
    } catch (error) {
        console.error(`Failed to fetch user results data: ${error}`);
        
        // Return cached response if network request fails
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cached data, return empty but valid JSON
        return new Response(JSON.stringify({
            offline: true,
            cached: false,
            message: "No user results data available offline"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Prefetch important API endpoints to improve first-load experience
async function prefetchApiEndpoints() {
    const endpoints = [
        '/api/seasons',
        '/api/results'
    ];
    
    const cache = await caches.open(API_CACHE_NAME);
    
    for (const endpoint of endpoints) {
        try {
            const request = new Request(endpoint, { cache: 'reload' });
            const response = await fetch(request);
            
            if (response.ok) {
                const data = await response.clone().json();
                
                // Add timestamp to the data
                const enhancedData = {
                    ...data,
                    timestamp: Date.now()
                };
                
                // Cache the enhanced response
                const enhancedResponse = new Response(JSON.stringify(enhancedData), {
                    headers: new Headers(response.headers)
                });
                
                await cache.put(request, enhancedResponse);
                console.log(`Prefetched and cached: ${endpoint}`);
            }
        } catch (error) {
            console.warn(`Failed to prefetch ${endpoint}:`, error);
        }
    }
}

// Add an activate event listener to trigger prefetching
self.addEventListener('activate', (event) => {
    // Claim clients so the service worker can control pages immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            prefetchApiEndpoints(),
            updateCachedPages() // Update cached pages list when service worker activates
        ])
    );
});

// Function to cache multiple pages
async function cacheMultiplePages(pages: string[]) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    const fetchPromises = pages.map(page => 
        fetch(new Request(page, { cache: "reload" }))
            .then(response => {
                if (response.status === 200) {
                    return cache.put(page, response.clone())
                        .then(() => ({ page, status: 'success' }));
                }
                return { page, status: 'error', code: response.status };
            })
            .catch(error => {
                console.error(`Failed to cache page: ${page}`, error);
                return { page, status: 'error', message: error.message };
            })
    );
    
    const results = await Promise.all(fetchPromises);
    
    // Report newly cached pages
    await reportAllCachedPages();
    
    return results;
}

// Function to clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    
    // After clearing, re-cache critical things
    await caches.open(DYNAMIC_CACHE_NAME);
    
    // Notify about cache clearing
    await reportAllCachedPages();
    await reportCachedApiEndpoints();
    
    return { success: true };
}

// Report all cached pages to all clients
async function reportAllCachedPages() {
    try {
        // Get all cache stores
        const cacheNames = await caches.keys();
        let allUrls: string[] = [];
        
        // Collect URLs from all caches
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            const urls = requests.map(request => request.url);
            allUrls = [...allUrls, ...urls];
        }
        
        // Remove duplicates
        const uniqueUrls = [...new Set(allUrls)];
        
        // Report to all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ 
                type: "UPDATE_CACHED_PAGES", 
                pages: uniqueUrls 
            });
        });
        
        return uniqueUrls;
    } catch (error) {
        console.error("Error reporting cached pages:", error);
        return [];
    }
}
