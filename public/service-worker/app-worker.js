// Simplified service worker
const CACHE_VERSION = 'v1';
const DYNAMIC_CACHE = 'dynamic-cache-' + CACHE_VERSION;
const STATIC_CACHE = 'static-cache-' + CACHE_VERSION;
const API_CACHE = 'api-cache-' + CACHE_VERSION;

// This is required by Serwist for precaching
self.__SW_MANIFEST;

// Pages that should be pre-cached
const PAGES_TO_CACHE = [
    '/',
    '/vysledky',
    '/pravidla',
    '/offline',
    '/fotogalerie',
    '/kontakty'
];

// Additional resources to cache by default
const RESOURCES_TO_CACHE = [
    '/manifest.webmanifest',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/favicon.ico',
    '/favicon-196.png'
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

// Create an empty placeholder for script files
const createEmptyScriptResponse = () => {
    return new Response(
        '/* Empty script provided when offline */',
        {
            status: 200,
            headers: new Headers({
                'Content-Type': 'application/javascript',
                'Cache-Control': 'no-store'
            })
        }
    );
};

// Create an empty placeholder for CSS files
const createEmptyCssResponse = () => {
    return new Response(
        '/* Empty CSS provided when offline */',
        {
            status: 200,
            headers: new Headers({
                'Content-Type': 'text/css',
                'Cache-Control': 'no-store'
            })
        }
    );
};

// Create a basic manifest response
const createBasicManifestResponse = () => {
    return new Response(
        JSON.stringify({
            name: "Strakatá Turistika",
            short_name: "StrakatáTuristika",
            icons: [
                {
                    src: "/icons/icon-192x192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "/icons/icon-512x512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ],
            theme_color: "#ffffff",
            background_color: "#ffffff",
            start_url: "/",
            display: "standalone",
            orientation: "portrait",
            offline_enabled: true
        }),
        {
            status: 200,
            headers: new Headers({
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'no-store'
            })
        }
    );
};

// Helper function to check if a URL is a Next.js chunk
const isNextJsChunk = (url) => {
    return url.pathname.includes('/_next/static/chunks/') || 
           url.pathname.includes('/_next/static/css/') ||
           url.pathname.includes('/_next/static/media/');
};

// Helper function to check if a response is valid
const isValidResponse = (response) => {
    return response && response.ok && response.status === 200;
};

// Install event - cache important resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[Service Worker] Pre-caching important pages and resources');
                
                // If we're online, try to pre-cache important pages and resources
                if (!isOffline()) {
                    // Concatenate the lists of resources to cache
                    const allResourcesToCache = [...PAGES_TO_CACHE, ...RESOURCES_TO_CACHE];
                    
                    return cache.addAll(allResourcesToCache)
                        .catch(error => {
                            console.error('[Service Worker] Pre-caching failed:', error);
                            // Try caching items individually if the batch failed
                            const individualCachePromises = allResourcesToCache.map(resource => 
                                cache.add(resource)
                                    .catch(err => {
                                        console.error(`[Service Worker] Failed to cache ${resource}:`, err);
                                        return Promise.resolve(); // Continue even if individual item fails
                                    })
                            );
                            return Promise.all(individualCachePromises);
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
                        key !== API_CACHE) {
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

// Fetch event - intercept network requests
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Don't cache cross-origin requests, except for specific domains we trust
    if (!url.origin.includes(self.location.origin) && 
        !url.hostname.includes('tile.openstreetmap.org') && 
        !url.hostname.includes('server.arcgisonline.com')) {
        return;
    }
    
    // Skip POST requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle manifest file specially
    if (url.pathname.endsWith('/manifest.webmanifest') || url.pathname.endsWith('/manifest.json')) {
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
                                            console.error('[Service Worker] Failed to cache manifest:', err);
                                        });
                                });
                            return response;
                        })
                        .catch(error => {
                            console.warn('[Service Worker] Manifest fetch failed:', error);
                            // Return a basic manifest for offline use
                            return createBasicManifestResponse();
                        });
                })
                .catch(error => {
                    console.warn('[Service Worker] Manifest cache match failed:', error);
                    return createBasicManifestResponse();
                })
        );
        return;
    }
    
    // Handle Next.js chunks specially - these are important for page functionality
    if (isNextJsChunk(url)) {
        event.respondWith(
            safeCacheMatch(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return safeFetch(request)
                        .then(response => {
                            // Only cache successful responses
                            if (!response || !response.ok) {
                                return response;
                            }
                            
                            // Clone the response to store in cache
                            const clonedResponse = response.clone();
                            caches.open(STATIC_CACHE)
                                .then(cache => {
                                    cache.put(request, clonedResponse)
                                        .catch(err => {
                                            console.error('[Service Worker] Failed to cache Next.js chunk:', err);
                                        });
                                })
                                .catch(err => {
                                    console.error('[Service Worker] Failed to open static cache:', err);
                                });
                            
                            return response;
                        })
                        .catch(error => {
                            console.warn('[Service Worker] Next.js chunk fetch failed:', error);
                            // Provide an empty JavaScript response for scripts
                            if (url.pathname.endsWith('.js')) {
                                return createEmptyScriptResponse();
                            } else if (url.pathname.endsWith('.css')) {
                                return createEmptyCssResponse();
                            } else {
                                return new Response('', { status: 200 });
                            }
                        });
                })
                .catch(error => {
                    console.warn('[Service Worker] Next.js chunk cache match failed:', error);
                    // Provide an empty JavaScript response for scripts
                    if (url.pathname.endsWith('.js')) {
                        return createEmptyScriptResponse();
                    } else if (url.pathname.endsWith('.css')) {
                        return createEmptyCssResponse();
                    } else {
                        return new Response('', { status: 200 });
                    }
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
                            cache.put(request, clonedResponse);
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
        request.destination === 'font') {
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
                            // Return appropriate empty responses based on destination
                            if (request.destination === 'script') {
                                return createEmptyScriptResponse();
                            } else if (request.destination === 'style') {
                                return createEmptyCssResponse();
                            }
                            // For fonts or others, return an error response
                            return createFallbackResponse('Statický soubor není k dispozici offline');
                        });
                })
                .catch(error => {
                    console.warn('[Service Worker] Static asset cache match failed:', error);
                    // Return appropriate empty responses based on destination
                    if (request.destination === 'script') {
                        return createEmptyScriptResponse();
                    } else if (request.destination === 'style') {
                        return createEmptyCssResponse();
                    }
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
                            cache.put(request, clonedResponse);
                        });
                    
                    // Also cache styles and scripts needed for this page when online
                    cacheDependentResources(response.clone());
                    
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
    
    // Default: Cache falling back to network (General fallback)
    event.respondWith(
        safeCacheMatch(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log('[Service Worker] Default handler found in cache:', request.url);
                    return cachedResponse;
                }
                // console.log('[Service Worker] Default handler fetching from network:', request.url);
                // If not in cache, fetch from network
                return safeFetch(request)
                    .catch(error => {
                        console.warn('[Service Worker] Default handler fetch failed:', error, request.url);
                        // Provide appropriate fallback if network fails
                        const fileExtension = url.pathname.split('.').pop();
                        if (fileExtension === 'js' || request.destination === 'script') {
                            return createEmptyScriptResponse();
                        } else if (fileExtension === 'css' || request.destination === 'style') {
                            return createEmptyCssResponse();
                        }
                        // REMOVED specific image fallback check here
                        console.log('[Service Worker] Default handler returning generic fallback (network failed):', request.url);
                        return createFallbackResponse('Obsah není k dispozici offline');
                    });
            })
            .catch(error => {
                // This catch handles the failure of safeCacheMatch
                console.warn('[Service Worker] Default handler cache match failed, attempting network fetch:', error, request.url);
                return safeFetch(request)
                    .catch(fetchError => {
                        // This catch handles the failure of the fallback network fetch
                        console.warn('[Service Worker] Default handler fallback fetch also failed:', fetchError, request.url);
                        const fileExtension = url.pathname.split('.').pop();
                         if (fileExtension === 'js' || request.destination === 'script') {
                            return createEmptyScriptResponse();
                        } else if (fileExtension === 'css' || request.destination === 'style') {
                            return createEmptyCssResponse();
                        }
                         // REMOVED specific image fallback check here
                        console.log('[Service Worker] Default handler returning generic fallback (cache miss + network failed):', request.url);
                        return createFallbackResponse('Obsah není k dispozici offline');
                    });
            })
    );
});

// Function to extract and cache scripts and styles from a page response
const cacheDependentResources = async (response) => {
    try {
        const text = await response.text();
        const staticCache = await caches.open(STATIC_CACHE);
        
        // Extract Next.js chunks from the HTML
        const chunkMatches = [...text.matchAll(/(href|src)=["']([^"']*\/_next\/static\/[^"']*(\.js|\.css))["']/g)];
        
        // Fetch and cache each chunk
        const uniqueUrls = [...new Set(chunkMatches.map(match => match[2]))];
        
        // Cache each resource
        uniqueUrls.forEach(url => {
            if (!url.startsWith('http')) {
                url = new URL(url, self.location.origin).href;
            }
            
            fetch(url)
                .then(chunkResponse => {
                    if (chunkResponse.ok) {
                        staticCache.put(url, chunkResponse)
                            .catch(err => {
                                console.error('[Service Worker] Failed to cache dependent resource:', err);
                            });
                    }
                })
                .catch(error => {
                    console.warn('[Service Worker] Failed to fetch dependent resource:', error);
                });
        });
    } catch (error) {
        console.error('[Service Worker] Error caching dependent resources:', error);
    }
};

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
            
            // Use recursive caching for each page
            const recursiveCachePage = async (url) => {
                try {
                    if (isOffline()) {
                        console.log('[Service Worker] Offline, skipping recursive caching');
                        return;
                    }
                    
                    // Fetch the page
                    const response = await fetch(url);
                    if (!response.ok) {
                         console.error(`[Service Worker] Failed to fetch page for recursive cache: ${url} (${response.status})`);
                         return; // Don't cache bad responses
                    }
                    const clonedResponse = response.clone();
                    
                    // Cache the page itself
                    const dynamicCache = await caches.open(DYNAMIC_CACHE);
                    await dynamicCache.put(url, response);
                    
                    // Extract and cache dependent resources
                    await cacheDependentResources(clonedResponse);
                } catch (error) {
                    console.error(`[Service Worker] Failed to recursively cache page: ${url}`, error);
                }
            };

            Promise.all(pagesToCache.map(page => recursiveCachePage(page)))
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
                                caches.open(API_CACHE)
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
            
        case 'RECURSIVE_CACHE_PAGE':
            if (data.url) {
                const recursiveCachePageSingle = async (url) => {
                    try {
                        if (isOffline()) {
                            console.log('[Service Worker] Offline, skipping recursive caching');
                            return;
                        }
                        
                        // Fetch the page
                        const response = await fetch(url);
                         if (!response.ok) {
                             console.error(`[Service Worker] Failed to fetch page for recursive cache: ${url} (${response.status})`);
                             return; // Don't cache bad responses
                        }
                        const clonedResponse = response.clone();
                        
                        // Cache the page itself
                        const dynamicCache = await caches.open(DYNAMIC_CACHE);
                        await dynamicCache.put(url, response);
                        
                        // Extract and cache dependent resources
                        await cacheDependentResources(clonedResponse);
                    } catch (error) {
                        console.error(`[Service Worker] Failed to recursively cache page: ${url}`, error);
                         throw error; // Rethrow to be caught below
                    }
                };

                recursiveCachePageSingle(data.url)
                    .then(() => {
                        self.clients.matchAll()
                            .then(clients => {
                                clients.forEach(client => {
                                    client.postMessage({
                                        type: 'RECURSIVE_CACHE_COMPLETE',
                                        url: data.url,
                                        success: true
                                    });
                                });
                            });
                    })
                    .catch(error => {
                        console.error('[Service Worker] Recursive cache failed:', error);
                        self.clients.matchAll()
                            .then(clients => {
                                clients.forEach(client => {
                                    client.postMessage({
                                        type: 'RECURSIVE_CACHE_COMPLETE',
                                        url: data.url,
                                        success: false,
                                        message: error.message
                                    });
                                });
                            });
                    });
            }
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