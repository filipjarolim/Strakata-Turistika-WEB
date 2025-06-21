// Service Worker for offline GPS tracking app
// This file handles offline caching, background sync, and push notifications

const CACHE_NAME = 'gps-tracker-v1';
const OFFLINE_CACHE = 'gps-offline-v1';
const STATIC_CACHE = 'gps-static-v1';
const MAP_CACHE = 'gps-maps-v1';

// Cache URLs for offline functionality - only include files that actually exist
const STATIC_URLS = [
  '/',
  '/soutez/gps',
  '/offline',
  '/offline-map',
  '/manifest.json',
  '/favicon.ico'
];

// Remove non-existent API endpoints
const API_URLS = [
  // These endpoints don't exist yet, so we'll remove them
  // '/api/gps/sessions',
  // '/api/gps/positions',
  // '/api/gps/sync'
];

// Map tile patterns for caching
const MAP_TILE_PATTERNS = [
  'https://api.maptiler.com/maps/outdoor-v2/256/',
  'https://tile.openstreetmap.org/',
  'https://server.arcgisonline.com/'
];

// Install event - cache static assets with error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache static assets with individual error handling
      caches.open(STATIC_CACHE).then(cache => {
        return Promise.allSettled(
          STATIC_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null;
            })
          )
        );
      }),
      // Cache offline pages
      caches.open(OFFLINE_CACHE).then(cache => {
        return Promise.allSettled([
          cache.add('/offline').catch(error => {
            console.warn('Failed to cache /offline:', error);
            return null;
          }),
          cache.add('/offline-map').catch(error => {
            console.warn('Failed to cache /offline-map:', error);
            return null;
          })
        ]);
      }),
      // Pre-cache some map tiles for common areas
      caches.open(MAP_CACHE).then(cache => {
        const mapTiles = getCommonMapTiles();
        return Promise.allSettled(
          mapTiles.map(tile => 
            cache.add(tile).catch(error => {
              console.warn(`Failed to cache map tile ${tile}:`, error);
              return null;
            })
          )
        );
      })
    ]).catch(error => {
      console.error('Service worker install failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== OFFLINE_CACHE && 
                cacheName !== STATIC_CACHE &&
                cacheName !== MAP_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).catch(error => {
      console.error('Service worker activate failed:', error);
      // Don't fail the activate, just log the error
      return self.clients.claim();
    })
  );
});

// Fetch event - handle offline caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for unsupported request methods
  if (request.method === 'HEAD' || request.method === 'OPTIONS') {
    return;
  }

  // Handle API requests
  if (API_URLS.some(apiUrl => url.pathname.startsWith(apiUrl))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests (pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle map tile requests
  if (MAP_TILE_PATTERNS.some(pattern => url.href.startsWith(pattern))) {
    event.respondWith(handleMapTileRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(handleDefaultRequest(request));
});

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.status === 200 && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseClone).catch(error => {
          console.warn('Failed to cache navigation response:', error);
        });
      });
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback to basic offline response
    return new Response('Offline - No internet connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.status === 200 && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, responseClone).catch(error => {
          console.warn('Failed to cache static response:', error);
        });
      });
    }
    
    return response;
  } catch (error) {
    // Return empty response for failed static assets
    return new Response('', { status: 404 });
  }
}

// Handle map tile requests
async function handleMapTileRequest(request) {
  // Try cache first for map tiles
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.status === 200 && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(MAP_CACHE).then(cache => {
        cache.put(request, responseClone).catch(error => {
          console.warn('Failed to cache map tile:', error);
        });
      });
    }
    
    return response;
  } catch (error) {
    // Return a placeholder tile or empty response
    return new Response('', { status: 404 });
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Try network first for API requests
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.status === 200 && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseClone).catch(error => {
          console.warn('Failed to cache API response:', error);
        });
      });
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response for API requests
    return new Response(JSON.stringify({ error: 'Offline - API unavailable' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.status === 200 && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseClone).catch(error => {
          console.warn('Failed to cache response:', error);
        });
      });
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Offline - No internet connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Helper function to get common map tiles for pre-caching
function getCommonMapTiles() {
  const tiles = [];
  const centerLat = 50.0755; // Prague center
  const centerLng = 14.4378;
  
  // Pre-cache tiles for common zoom levels around Prague
  const zoomLevels = [13, 14, 15];
  const radiusDegrees = 0.05; // ~5km radius
  
  for (const zoom of zoomLevels) {
    const tileCoords = getTileCoordinates(centerLat, centerLng, zoom, radiusDegrees);
    for (const [x, y] of tileCoords) {
      tiles.push(`https://api.maptiler.com/maps/outdoor-v2/256/${zoom}/${x}/${y}.png?key=a5w3EO45npvzNFzD6VoD`);
    }
  }
  
  return tiles.slice(0, 50); // Limit to 50 tiles to avoid overwhelming the cache
}

// Helper function to get tile coordinates for an area
function getTileCoordinates(lat, lng, zoom, radiusDegrees) {
  const tiles = [];
  const latMin = lat - radiusDegrees;
  const latMax = lat + radiusDegrees;
  const lngMin = lng - radiusDegrees;
  const lngMax = lng + radiusDegrees;
  
  // Convert to tile coordinates
  const n = Math.pow(2, zoom);
  const xtileMin = Math.floor((lngMin + 180) / 360 * n);
  const xtileMax = Math.floor((lngMax + 180) / 360 * n);
  const ytileMin = Math.floor((1 - Math.log(Math.tan(latMin * Math.PI / 180) + 1 / Math.cos(latMin * Math.PI / 180)) / Math.PI) / 2 * n);
  const ytileMax = Math.floor((1 - Math.log(Math.tan(latMax * Math.PI / 180) + 1 / Math.cos(latMax * Math.PI / 180)) / Math.PI) / 2 * n);
  
  for (let x = xtileMin; x <= xtileMax; x++) {
    for (let y = ytileMin; y <= ytileMax; y++) {
      tiles.push([x, y]);
    }
  }
  
  return tiles;
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'gps-sync') {
    event.waitUntil(syncGPSData());
  }
});

// Sync GPS data when back online
async function syncGPSData() {
  try {
    // Get stored GPS data from IndexedDB or localStorage
    const storedData = await getStoredGPSData();
    
    if (storedData && storedData.length > 0) {
      // Send data to server
      for (const data of storedData) {
        try {
          await fetch('/api/gps/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          // Remove synced data from storage
          await removeStoredGPSData(data.id);
        } catch (error) {
          console.error('Failed to sync GPS data:', error);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for GPS data storage (placeholder)
async function getStoredGPSData() {
  // This would typically use IndexedDB
  return [];
}

async function removeStoredGPSData(id) {
  // This would typically use IndexedDB
  console.log('Removing GPS data:', id);
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle specific action
    console.log('Notification action clicked:', event.action);
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 