/**
 * Strakatá turistika Service Worker
 * Comprehensive PWA implementation with offline support
 */

// Cache names with version numbers to manage updates
const CACHE_NAMES = {
  STATIC: 'static-resources-v1',
  DYNAMIC: 'dynamic-data-v1',
  API: 'api-responses-v1',
  PAGES: 'pages-v1'
};

// Critical resources to cache during installation
const STATIC_RESOURCES = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/dog_emoji.png',
  '/favicon.ico'
];

// API endpoints that should be cached for offline access
const API_ROUTES = [
  '/api/seasons',
  '/api/results',
  '/api/user/results'
];

// Pages that should work offline
const CRITICAL_PAGES = [
  '/',
  '/vysledky',
  '/pravidla',
  '/offline',
  '/prihlaseni'
];

// Network timeout for fetch requests
const NETWORK_TIMEOUT = 5000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Handle timed-out requests
 * @param {Promise} promise - The fetch promise
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} - The fetch promise or a timeout error
 */
function timeoutPromise(promise, ms) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

/**
 * Get cached response with timestamp validation
 * @param {Request} request - The request
 * @param {string} cacheName - Cache to check
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {Promise<Response|null>} - Cached response or null
 */
async function getValidCachedResponse(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) return null;
  
  try {
    // Check for timestamp in the cached response
    const data = await cachedResponse.clone().json();
    if (data._timestamp && (Date.now() - data._timestamp < maxAge)) {
      return cachedResponse;
    }
  } catch (error) {
    // If we can't parse JSON, assume it's still valid
    return cachedResponse;
  }
  
  return null;
}

/**
 * Cache a response with a timestamp
 * @param {Request} request - The original request
 * @param {Response} response - The response to cache
 * @param {string} cacheName - Which cache to use
 */
async function cacheWithTimestamp(request, response, cacheName) {
  const cache = await caches.open(cacheName);
  
  if (request.url.includes('/api/')) {
    try {
      // Add timestamp to API responses
      const data = await response.clone().json();
      const timestampedData = {
        ...data,
        _timestamp: Date.now()
      };
      
      const timestampedResponse = new Response(
        JSON.stringify(timestampedData),
        { headers: response.headers }
      );
      
      await cache.put(request, timestampedResponse);
    } catch (error) {
      // If we can't modify the response, cache it as is
      await cache.put(request, response.clone());
    }
  } else {
    // For non-API responses, cache as is
    await cache.put(request, response.clone());
  }
}

/**
 * Handle API requests with intelligent caching
 * @param {Request} request - Original request
 * @returns {Promise<Response>} - Response from network or cache
 */
async function handleApiRequest(request) {
  const cacheName = CACHE_NAMES.API;
  const maxAge = 60 * 60 * 1000; // 1 hour for API data
  
  try {
    // Try network first with timeout
    const networkPromise = timeoutPromise(
      fetch(request.clone()),
      NETWORK_TIMEOUT
    );
    
    try {
      const networkResponse = await networkPromise;
      
      if (networkResponse.ok) {
        // Cache fresh response
        await cacheWithTimestamp(request, networkResponse.clone(), cacheName);
        return networkResponse;
      }
    } catch (error) {
      console.log('Network request failed, falling back to cache:', error);
    }
    
    // Fallback to cache
    const cachedResponse = await getValidCachedResponse(request, cacheName, maxAge);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try any cached response, even if expired
    const cache = await caches.open(cacheName);
    const expiredResponse = await cache.match(request);
    if (expiredResponse) {
      return expiredResponse;
    }
    
    // If no cached response at all, return offline JSON
    return new Response(
      JSON.stringify({ 
        offline: true, 
        message: 'No data available offline',
        _timestamp: Date.now()
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API request handler error:', error);
    
    // Last resort fallback
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: 'Failed to fetch data' 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Clean up old caches that are no longer needed
 */
async function cleanupCaches() {
  const validCacheNames = Object.values(CACHE_NAMES);
  const keys = await caches.keys();
  
  for (const key of keys) {
    if (!validCacheNames.includes(key)) {
      await caches.delete(key);
      console.log(`Deleted old cache: ${key}`);
    }
  }
}

/**
 * Broadcast offline status to all clients
 * @param {boolean} isOffline - Whether we're offline
 */
async function broadcastOfflineStatus(isOffline) {
  const clients = await self.clients.matchAll();
  
  for (const client of clients) {
    client.postMessage({
      type: 'CONNECTION_STATUS',
      isOffline: isOffline
    });
  }
}

// ============================================================================
// SERVICE WORKER EVENT HANDLERS
// ============================================================================

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('Service worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAMES.STATIC).then(cache => 
        cache.addAll(STATIC_RESOURCES)
      ),
      
      // Cache critical pages
      caches.open(CACHE_NAMES.PAGES).then(cache => 
        Promise.all(
          CRITICAL_PAGES.map(url => 
            fetch(url)
              .then(response => cache.put(url, response))
              .catch(error => console.warn(`Failed to cache ${url}:`, error))
          )
        )
      )
    ])
    .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service worker activating...');
  
  event.waitUntil(
    Promise.all([
      cleanupCaches(),
      self.clients.claim(),
      
      // Prefetch API routes once activated
      Promise.all(
        API_ROUTES.map(url => 
          fetch(url)
            .then(response => 
              cacheWithTimestamp(
                new Request(url),
                response,
                CACHE_NAMES.API
              )
            )
            .catch(error => console.warn(`Failed to prefetch ${url}:`, error))
        )
      )
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests or cross-origin requests (except for selected map tiles)
  if (request.method !== 'GET' || 
     (!url.origin.includes(self.location.origin) &&
      !url.hostname.includes('tile.openstreetmap.org') &&
      !url.hostname.includes('server.arcgisonline.com'))) {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle page requests with network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network fails, try to return the cached page
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If the specific page isn't cached, return the offline page
              return caches.match('/offline');
            });
        })
    );
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js')) {
    
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached version and update cache in the background
            fetch(request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  caches.open(CACHE_NAMES.STATIC)
                    .then(cache => cache.put(request, networkResponse));
                }
              })
              .catch(() => {});
            
            return cachedResponse;
          }
          
          // If not in cache, get from network and cache it
          return fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                const clonedResponse = networkResponse.clone();
                caches.open(CACHE_NAMES.STATIC)
                  .then(cache => cache.put(request, clonedResponse));
              }
              return networkResponse;
            });
        })
    );
    return;
  }
  
  // Default strategy (network first, then cache)
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAMES.DYNAMIC)
            .then(cache => cache.put(request, clonedResponse));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

// Background sync for pending data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tracks') {
    event.waitUntil(
      // Attempt to sync offline-stored GPS tracks
      caches.open(CACHE_NAMES.DYNAMIC)
        .then(cache => cache.match('/pending-tracks'))
        .then(response => response && response.json())
        .then(tracks => {
          if (tracks && tracks.length > 0) {
            return fetch('/api/tracks/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(tracks)
            })
            .then(response => {
              if (response.ok) {
                // Clear pending tracks after successful sync
                return caches.open(CACHE_NAMES.DYNAMIC)
                  .then(cache => cache.delete('/pending-tracks'));
              }
            });
          }
        })
        .catch(error => console.error('Sync failed:', error))
    );
  }
});

// Message handler for communication with clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_ONLINE_STATUS') {
    // Send a small ping request to check connectivity
    fetch('/api/ping', { method: 'HEAD' })
      .then(() => broadcastOfflineStatus(false))
      .catch(() => broadcastOfflineStatus(true));
  }
  
  if (event.data && event.data.type === 'CACHE_PAGE') {
    const { url } = event.data;
    if (url) {
      caches.open(CACHE_NAMES.PAGES)
        .then(cache => fetch(url).then(response => cache.put(url, response)))
        .then(() => {
          console.log(`Cached page: ${url}`);
          event.source.postMessage({
            type: 'PAGE_CACHED',
            url
          });
        })
        .catch(error => console.error(`Failed to cache page ${url}:`, error));
    }
  }
  
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    cleanupCaches()
      .then(() => {
        event.source.postMessage({
          type: 'CACHES_CLEARED'
        });
      });
  }
});

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nová notifikace',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Strakatá turistika', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Focus existing window if found
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow(url);
      })
  );
});

// Periodically check online status and broadcast to clients
setInterval(() => {
  fetch('/api/ping', { method: 'HEAD' })
    .then(() => broadcastOfflineStatus(false))
    .catch(() => broadcastOfflineStatus(true));
}, 30000); // Check every 30 seconds