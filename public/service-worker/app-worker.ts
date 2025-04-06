import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import type { RuntimeCaching } from "serwist";

declare const self: ServiceWorkerGlobalScope;

// This is required by Serwist
declare global {
    interface WorkerGlobalScope {
        __SW_MANIFEST: any;
    }
}

// Define basic cache names
const DYNAMIC_CACHE_NAME = "dynamic-app-data-v1";
const API_CACHE_NAME = "api-responses-v1";
const RESULTS_CACHE_NAME = "results-data-v1";

// List of important pages to cache
const PAGES_TO_CACHE = [
    "/", 
    "/vysledky", 
    "/pravidla", 
    "/offline"
];

// Simple runtime caching configuration
const runtimeCaching = [
    ...defaultCache,
    {
        urlPattern: /\/api\//,
        handler: "NetworkFirst" as const,
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
        handler: "StaleWhileRevalidate" as const,
        options: {
            cacheName: "static-assets",
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
        },
    },
] as RuntimeCaching[];

// Initialize Serwist with basic configuration
const serwist = new Serwist({
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching,
    precacheEntries: self.__SW_MANIFEST
});

// Register Serwist listeners
serwist.addEventListeners();

// Install handler - cache important pages
self.addEventListener("install", (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                return Promise.all(
                    PAGES_TO_CACHE.map(page => 
                        fetch(page, { cache: "reload" })
                            .then(response => {
                                if (response.status === 200) {
                                    return cache.put(page, response);
                                }
                            })
                            .catch(error => console.error(`Failed to cache page: ${page}`, error))
                    )
                );
            })
        ])
    );
});

// Handle messages from clients
self.addEventListener("message", (event) => {
    if (!event.data) return;
    
    switch (event.data.type) {
        case 'CACHE_ALL_PAGES':
            event.waitUntil(
                caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                    const pages = event.data.pages || PAGES_TO_CACHE;
                    return Promise.all(
                        pages.map((page: string) => 
                            fetch(page, { cache: "reload" })
                                .then(response => {
                                    if (response.status === 200) {
                                        return cache.put(page, response);
                                    }
                                })
                                .catch(error => console.error(`Failed to cache page: ${page}`, error))
                        )
                    ).then(() => {
                        // Notify clients
                        self.clients.matchAll().then(clients => {
                            clients.forEach(client => {
                                client.postMessage({ type: "CACHE_COMPLETE", success: true });
                            });
                        });
                    });
                })
            );
            break;
            
        case 'CLEAR_ALL_CACHE':
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    ).then(() => {
                        // Notify clients
                        self.clients.matchAll().then(clients => {
                            clients.forEach(client => {
                                client.postMessage({ type: "CACHE_CLEARED", success: true });
                            });
                        });
                    });
                })
            );
            break;
            
        case 'REQUEST_CACHED_PAGES':
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => 
                            caches.open(cacheName).then(cache => 
                                cache.keys().then(requests => 
                                    requests.map(request => request.url)
                                )
                            )
                        )
                    ).then(urlArrays => {
                        // Flatten and deduplicate
                        const allUrls = [...new Set(([] as string[]).concat(...(urlArrays as string[][])))];
                        
                        // Send to client
                        self.clients.matchAll().then(clients => {
                            clients.forEach(client => {
                                client.postMessage({ 
                                    type: "UPDATE_CACHED_PAGES", 
                                    pages: allUrls 
                                });
                            });
                        });
                    });
                })
            );
            break;
            
        case 'REQUEST_CACHED_ENDPOINTS':
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => 
                            caches.open(cacheName).then(cache => 
                                cache.keys().then(requests => 
                                    requests
                                        .map(request => request.url)
                                        .filter(url => url.includes('/api/'))
                                )
                            )
                        )
                    ).then(urlArrays => {
                        // Flatten and deduplicate
                        const apiUrls = [...new Set(([] as string[]).concat(...(urlArrays as string[][])))];
                        
                        // Send to client
                        self.clients.matchAll().then(clients => {
                            clients.forEach(client => {
                                client.postMessage({ 
                                    type: "UPDATE_CACHED_API_ENDPOINTS", 
                                    endpoints: apiUrls,
                                    timestamp: Date.now()
                                });
                            });
                        });
                    });
                })
            );
            break;
    }
});

// Function to cache multiple pages
async function cacheMultiplePages(pages: string[]) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    const fetchPromises = pages.map(page => 
        fetch(page, { cache: "reload" })
            .then(response => {
                if (response.status === 200) {
                    return cache.put(page, response);
                }
            })
            .catch(error => console.error(`Failed to cache page: ${page}`, error))
    );
    
    return Promise.all(fetchPromises);
}
