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

// Helper function to detect offline status
const isOffline = () => {
    return ('onLine' in self) ? !self.onLine : false;
};

// Safe fetch that won't throw uncaught errors in offline mode
const safeFetch = async (request) => {
    if (isOffline()) {
        console.log('[Service Worker] Network is offline, skipping fetch');
        return Promise.reject(new Error('Network is offline'));
    }
    
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        console.error('[Service Worker] Fetch failed:', error);
        return Promise.reject(error);
    }
};

// Safe cache match that handles errors
const safeCacheMatch = async (request) => {
    try {
        const cachedResponse = await caches.match(request);
        return cachedResponse || Promise.reject(new Error('No cached response found'));
    } catch (error) {
        console.error('[Service Worker] Cache match failed:', error);
        return Promise.reject(error);
    }
};

// Create a fallback response with proper error status
const createFallbackResponse = (message) => {
    return new Response(
        `<html>
            <head>
                <title>Offline</title>
                <style>
                    body {
                        font-family: sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    .error {
                        max-width: 500px;
                        margin: 0 auto;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <h1>Momentálně jste offline</h1>
                <div class="error">
                    <p>${message || 'Požadovaný obsah není k dispozici v offline režimu.'}</p>
                    <p>Zkontrolujte své připojení k internetu a zkuste to znovu.</p>
                </div>
            </body>
        </html>`,
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/html',
                'Cache-Control': 'no-store'
            })
        }
    );
};

// Install event - cache important resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[Service Worker] Pre-caching important pages');
                // If we're online, try to pre-cache important pages
                if (!isOffline()) {
                    return cache.addAll(PAGES_TO_CACHE)
                        .catch(error => {
                            console.error('[Service Worker] Pre-caching failed:', error);
                            // Continue installation even if precaching fails
                            return Promise.resolve();
                        });
                } else {
                    console.log('[Service Worker] Offline during install, skipping pre-cache');
                    return Promise.resolve();
                }
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
            safeCacheMatch(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        // If we have a cached version, return it immediately
                        return cachedResponse;
                    }
                    
                    // Try to fetch from network
                    return safeFetch(request)
                        .then(response => {
                            // Only cache successful responses
                            if (!response || !response.ok) {
                                return response;
                            }
                            
                            // Clone the response to store in cache
                            const clonedResponse = response.clone();
                            caches.open(IMAGE_CACHE)
                                .then(cache => {
                                    cache.put(request, clonedResponse)
                                        .catch(err => {
                                            console.error('[Service Worker] Failed to cache image:', err);
                                        });
                                })
                                .catch(err => {
                                    console.error('[Service Worker] Failed to open image cache:', err);
                                });
                            
                            return response;
                        })
                        .catch(error => {
                            console.warn('[Service Worker] Image fetch failed:', error);
                            // If network fails and no cache exists, return an offline image placeholder
                            return Promise.resolve(
                                new Response(
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="system-ui, sans-serif" font-size="24">Image unavailable offline</text></svg>',
                                    { 
                                        status: 200, 
                                        headers: new Headers({ 'Content-Type': 'image/svg+xml' }) 
                                    }
                                )
                            );
                        });
                })
                .catch(error => {
                    console.warn('[Service Worker] Image cache match failed:', error);
                    return new Response(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="system-ui, sans-serif" font-size="24">Image unavailable offline</text></svg>',
                        { 
                            status: 200, 
                            headers: new Headers({ 'Content-Type': 'image/svg+xml' }) 
                        }
                    );
                })
        );
        return;
    }
    
    // Handle API requests with Network-First strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            safeFetch(request)
                .then(response => {
                    // Clone the response to store in cache
                    const clonedResponse = response.clone();
                    caches.open(API_CACHE)
                        .then(cache => {
                            cache.put(request, clonedResponse)
                                .catch(err => {
                                    console.error('[Service Worker] Failed to cache API response:', err);
                                });
                        })
                        .catch(err => {
                            console.error('[Service Worker] Failed to open API cache:', err);
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return safeCacheMatch(request)
                        .catch(() => {
                            // Return empty JSON for API requests when offline and not cached
                            return new Response(JSON.stringify({ 
                                error: true, 
                                message: 'Offline mode: API not available',
                                offlineMode: true
                            }), {
                                status: 503,
                                headers: new Headers({
                                    'Content-Type': 'application/json',
                                    'Cache-Control': 'no-store'
                                })
                            });
                        });
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
            safeCacheMatch(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return safeFetch(request)
                        .then(response => {
                            // Store in cache
                            const clonedResponse = response.clone();
                            caches.open(STATIC_CACHE)
                                .then(cache => {
                                    cache.put(request, clonedResponse)
                                        .catch(err => {
                                            console.error('[Service Worker] Failed to cache static asset:', err);
                                        });
                                })
                                .catch(err => {
                                    console.error('[Service Worker] Failed to open static cache:', err);
                                });
                            return response;
                        })
                        .catch(error => {
                            console.warn('[Service Worker] Failed to fetch static asset:', error);
                            if (request.destination === 'image') {
                                // Return placeholder for images
                                return new Response(
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="system-ui, sans-serif" font-size="24">Image unavailable offline</text></svg>',
                                    { 
                                        status: 200, 
                                        headers: new Headers({ 'Content-Type': 'image/svg+xml' }) 
                                    }
                                );
                            }
                            // For other assets, return an error response
                            return createFallbackResponse('Statický soubor není k dispozici offline');
                        });
                })
                .catch(error => {
                    console.warn('[Service Worker] Static asset cache match failed:', error);
                    return createFallbackResponse('Statický soubor není k dispozici offline');
                })
        );
        return;
    }
    
    // For page navigations, use Network-First with fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            safeFetch(request)
                .then(response => {
                    // Cache the page for offline use
                    const clonedResponse = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(request, clonedResponse)
                                .catch(err => {
                                    console.error('[Service Worker] Failed to cache page:', err);
                                });
                        })
                        .catch(err => {
                            console.error('[Service Worker] Failed to open dynamic cache:', err);
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try to get from cache
                    return safeCacheMatch(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // If not in cache, use offline fallback
                            return safeCacheMatch('/offline')
                                .catch(() => {
                                    return createFallbackResponse('Stránka není k dispozici offline');
                                });
                        })
                        .catch(() => {
                            return createFallbackResponse('Stránka není k dispozici offline');
                        });
                })
        );
        return;
    }
    
    // Default: Cache falling back to network
    event.respondWith(
        safeCacheMatch(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return safeFetch(request)
                    .catch(error => {
                        console.warn('[Service Worker] Default handler fetch failed:', error);
                        return createFallbackResponse('Obsah není k dispozici offline');
                    });
            })
            .catch(error => {
                console.warn('[Service Worker] Default handler cache match failed:', error);
                return createFallbackResponse('Obsah není k dispozici offline');
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
            
            // Skip caching if offline
            if (isOffline()) {
                self.clients.matchAll()
                    .then(clients => {
                        clients.forEach(client => {
                            client.postMessage({
                                type: 'CACHE_COMPLETE',
                                success: false,
                                message: 'Cannot cache pages while offline'
                            });
                        });
                    });
                return;
            }
            
            caches.open(DYNAMIC_CACHE)
                .then(cache => {
                    const fetchPromises = pagesToCache.map(page => 
                        safeFetch(page)
                            .then(response => {
                                if (response.ok) {
                                    return cache.put(page, response)
                                        .catch(error => {
                                            console.error('[Service Worker] Failed to put in cache:', page, error);
                                            return Promise.resolve();
                                        });
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
                        })
                        .catch(error => {
                            console.error('[Service Worker] Cache all pages failed:', error);
                            self.clients.matchAll()
                                .then(clients => {
                                    clients.forEach(client => {
                                        client.postMessage({
                                            type: 'CACHE_COMPLETE',
                                            success: false,
                                            message: error.message
                                        });
                                    });
                                });
                        });
                })
                .catch(error => {
                    console.error('[Service Worker] Failed to open dynamic cache:', error);
                    self.clients.matchAll()
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'CACHE_COMPLETE',
                                    success: false,
                                    message: error.message
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
                        })
                        .catch(error => {
                            console.error('[Service Worker] Clear cache failed:', error);
                            self.clients.matchAll()
                                .then(clients => {
                                    clients.forEach(client => {
                                        client.postMessage({
                                            type: 'CACHE_CLEARED',
                                            success: false,
                                            message: error.message
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
                            .catch(() => []) // Return empty array on error
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
                })
                .catch(error => {
                    console.error('[Service Worker] Request cached pages failed:', error);
                    self.clients.matchAll()
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'UPDATE_CACHED_PAGES',
                                    pages: [],
                                    error: error.message
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
                            .catch(() => []) // Return empty array on error
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
                })
                .catch(error => {
                    console.error('[Service Worker] Request cached endpoints failed:', error);
                    self.clients.matchAll()
                        .then(clients => {
                            clients.forEach(client => {
                                client.postMessage({
                                    type: 'UPDATE_CACHED_API_ENDPOINTS',
                                    endpoints: [],
                                    timestamp: Date.now(),
                                    error: error.message
                                });
                            });
                        });
                });
            break;
    }
}); 