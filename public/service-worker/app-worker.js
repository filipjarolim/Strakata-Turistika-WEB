// Simplified service worker
const CACHE_VERSION = 'v1';
const DYNAMIC_CACHE = 'dynamic-cache-' + CACHE_VERSION;
const STATIC_CACHE = 'static-cache-' + CACHE_VERSION;
const API_CACHE = 'api-cache-' + CACHE_VERSION;
const IMAGE_CACHE = 'image-cache-' + CACHE_VERSION;

// This is required by Serwist for precaching
self.__SW_MANIFEST;

// Pages that should be pre-cached
const PAGES_TO_CACHE = [
    '/',
    '/vysledky',
    '/pravidla',
    '/offline'
];

// Install event - cache important resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[Service Worker] Pre-caching important pages');
                // Pre-cache important pages
                return cache.addAll(PAGES_TO_CACHE);
            })
            .catch(error => {
                console.error('[Service Worker] Pre-caching failed:', error);
                // Continue installation even if precaching fails
                return Promise.resolve();
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys()
            .then(keyList => {
                return Promise.all(keyList.map(key => {
                    // If a cache doesn't match our current version, delete it
                    if (key !== STATIC_CACHE && 
                        key !== DYNAMIC_CACHE && 
                        key !== API_CACHE &&
                        key !== IMAGE_CACHE) {
                        console.log('[Service Worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                    return Promise.resolve();
                }));
            })
            .then(() => {
                console.log('[Service Worker] Claiming clients...');
                return self.clients.claim();
            })
    );
});

// Helper function to check if a URL is a Next.js image
const isNextJsImage = (url) => {
    return url.pathname.startsWith('/_next/image') || 
           url.pathname.includes('/images/') ||
           url.pathname.includes('/locations/');
};

// Fetch event - intercept network requests
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Don't cache cross-origin requests, browser extensions, etc.
    if (!url.origin.includes(self.location.origin) && 
        !url.hostname.includes('tile.openstreetmap.org') && 
        !url.hostname.includes('server.arcgisonline.com')) {
        return;
    }
    
    // Skip POST requests, etc.
    if (request.method !== 'GET') {
        return;
    }
    
    // Special handling for Next.js image optimization routes
    if (isNextJsImage(url)) {
        event.respondWith(
            // Network first, then cache
            fetch(request)
                .then(response => {
                    // Only cache successful responses
                    if (!response || !response.ok) {
                        return response;
                    }
                    
                    // Clone the response to store in cache
                    const clonedResponse = response.clone();
                    caches.open(IMAGE_CACHE)
                        .then(cache => {
                            cache.put(request, clonedResponse);
                        })
                        .catch(err => {
                            console.error('[Service Worker] Failed to cache image:', err);
                        });
                    
                    return response;
                })
                .catch(error => {
                    console.error('[Service Worker] Image fetch failed:', error);
                    // Try to get from cache if network failed
                    return caches.match(request)
                        .catch(err => {
                            console.error('[Service Worker] Image cache match failed:', err);
                            return Promise.reject('no-response');
                        });
                })
        );
        return;
    }
    
    // Handle API requests with Network-First strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Clone the response to store in cache
                    const clonedResponse = response.clone();
                    caches.open(API_CACHE)
                        .then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return caches.match(request);
                })
        );
        return;
    }
    
    // Handle static assets with Cache-First strategy
    if (request.destination === 'style' || 
        request.destination === 'script' || 
        request.destination === 'font' || 
        request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request)
                        .then(response => {
                            // Store in cache
                            const clonedResponse = response.clone();
                            caches.open(STATIC_CACHE)
                                .then(cache => {
                                    cache.put(request, clonedResponse);
                                });
                            return response;
                        });
                })
        );
        return;
    }
    
    // For page navigations, use Network-First with fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache the page for offline use
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(request, clonedResponse);
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // If not in cache, use offline fallback
                            return caches.match('/offline');
                        });
                })
        );
        return;
    }
    
    // Default: Cache falling back to network
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request);
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    const data = event.data;
    if (!data) return;
    
    switch (data.type) {
        case 'CACHE_ALL_PAGES':
            const pagesToCache = data.pages || PAGES_TO_CACHE;
            caches.open(DYNAMIC_CACHE)
                .then(cache => {
                    const fetchPromises = pagesToCache.map(page => 
                        fetch(page)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(page, response);
                                }
                                return Promise.resolve();
                            })
                            .catch(error => {
                                console.error('[Service Worker] Failed to cache:', page, error);
                                return Promise.resolve();
                            })
                    );
                    
                    Promise.all(fetchPromises)
                        .then(() => {
                            self.clients.matchAll()
                                .then(clients => {
                                    clients.forEach(client => {
                                        client.postMessage({
                                            type: 'CACHE_COMPLETE',
                                            success: true
                                        });
                                    });
                                });
                        });
                });
            break;
            
        case 'CLEAR_ALL_CACHE':
            caches.keys()
                .then(keyList => {
                    const deletePromises = keyList.map(key => caches.delete(key));
                    
                    Promise.all(deletePromises)
                        .then(() => {
                            // Recreate main caches
                            return Promise.all([
                                caches.open(STATIC_CACHE),
                                caches.open(DYNAMIC_CACHE),
                                caches.open(API_CACHE),
                                caches.open(IMAGE_CACHE)
                            ]);
                        })
                        .then(() => {
                            self.clients.matchAll()
                                .then(clients => {
                                    clients.forEach(client => {
                                        client.postMessage({
                                            type: 'CACHE_CLEARED',
                                            success: true
                                        });
                                    });
                                });
                        });
                });
            break;
            
        case 'REQUEST_CACHED_PAGES':
            caches.keys()
                .then(keyList => {
                    const getAllCachePromises = keyList.map(cacheName => 
                        caches.open(cacheName)
                            .then(cache => cache.keys())
                            .then(requests => requests.map(request => request.url))
                    );
                    
                    return Promise.all(getAllCachePromises);
                })
                .then(nestedUrls => {
                    // Flatten the array of arrays
                    const allUrls = [].concat(...nestedUrls);
                    // Remove duplicates
                    const uniqueUrls = [...new Set(allUrls)];
                    
                    self.clients.matchAll()
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'UPDATE_CACHED_PAGES',
                                    pages: uniqueUrls
                                });
                            });
                        });
                });
            break;
            
        case 'REQUEST_CACHED_ENDPOINTS':
            caches.keys()
                .then(keyList => {
                    const getApiCachePromises = keyList.map(cacheName => 
                        caches.open(cacheName)
                            .then(cache => cache.keys())
                            .then(requests => requests
                                .map(request => request.url)
                                .filter(url => url.includes('/api/'))
                            )
                    );
                    
                    return Promise.all(getApiCachePromises);
                })
                .then(nestedUrls => {
                    // Flatten the array of arrays
                    const allApiUrls = [].concat(...nestedUrls);
                    // Remove duplicates
                    const uniqueApiUrls = [...new Set(allApiUrls)];
                    
                    self.clients.matchAll()
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'UPDATE_CACHED_API_ENDPOINTS',
                                    endpoints: uniqueApiUrls,
                                    timestamp: Date.now()
                                });
                            });
                        });
                });
            break;
    }
}); 