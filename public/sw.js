// Enhanced Service Worker for offline GPS tracking app
// This file handles offline caching, background sync, and push notifications with improved background tracking

const CACHE_NAME = 'gps-tracker-v2';
const OFFLINE_CACHE = 'gps-offline-v2';
const STATIC_CACHE = 'gps-static-v2';
const MAP_CACHE = 'gps-maps-v2';
const GPS_DATA_CACHE = 'gps-data-v2';

// Cache URLs for offline functionality - only include files that actually exist
const STATIC_URLS = [
  '/',
  '/soutez/gps',
  '/offline',
  '/offline-map',
  '/manifest.json',
  '/favicon.ico'
];

// GPS tracking specific endpoints
const GPS_API_URLS = [
  '/api/gps/sync',
  '/api/saveTrack',
  '/api/visitData'
];

// Map tile patterns for caching
const MAP_TILE_PATTERNS = [
  'https://api.maptiler.com/maps/outdoor-v2/256/',
  'https://tile.openstreetmap.org/',
  'https://server.arcgisonline.com/'
];

// Background tracking configuration
const BACKGROUND_CONFIG = {
  trackingInterval: 5000, // 5 seconds
  keepAliveInterval: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 5000,
  wakeLockTimeout: 60000, // 60 seconds
  syncTimeout: 30000 // 30 seconds
};

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
      }),
      // Cache GPS data storage
      caches.open(GPS_DATA_CACHE).then(cache => {
        console.log('GPS data cache initialized');
        return Promise.resolve();
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
                cacheName !== MAP_CACHE &&
                cacheName !== GPS_DATA_CACHE) {
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

  // Handle GPS API requests
  if (GPS_API_URLS.some(apiUrl => url.pathname.startsWith(apiUrl))) {
    event.respondWith(handleGPSApiRequest(request));
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

// Handle GPS API requests with enhanced background support
async function handleGPSApiRequest(request) {
  try {
    // Try network first for API requests
    const response = await fetch(request);
    
    // Cache successful responses (only for GET requests)
    if (response.status === 200 && request.method === 'GET') {
      const responseClone = response.clone();
      caches.open(GPS_DATA_CACHE).then(cache => {
        cache.put(request, responseClone).catch(error => {
          console.warn('Failed to cache GPS API response:', error);
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
    return new Response(JSON.stringify({ error: 'Offline - GPS API unavailable' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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

// Enhanced background sync for GPS data
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'gps-tracking-sync') {
    event.waitUntil(syncGPSData());
  } else if (event.tag === 'gps-background-sync') {
    event.waitUntil(backgroundGPSTracking());
  } else if (event.tag === 'gps-keep-alive-sync') {
    event.waitUntil(keepAliveSync());
  }
});

// Enhanced GPS data sync
async function syncGPSData() {
  try {
    console.log('Starting GPS data sync...');
    
    // Get stored GPS data from IndexedDB or localStorage
    const storedData = await getStoredGPSData();
    
    if (storedData && storedData.length > 0) {
      console.log(`Syncing ${storedData.length} GPS data items...`);
      
      // Send data to server
      for (const data of storedData) {
        try {
          const response = await fetch('/api/gps/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          if (response.ok) {
            // Remove synced data from storage
            await removeStoredGPSData(data.id);
            console.log('Successfully synced GPS data item:', data.id);
          } else {
            console.error('Failed to sync GPS data item:', data.id, response.status);
          }
        } catch (error) {
          console.error('Failed to sync GPS data item:', data.id, error);
        }
      }
    }
    
    // Notify clients of sync completion
    notifyClients('SYNC_COMPLETED', { timestamp: Date.now() });
    
  } catch (error) {
    console.error('Background sync failed:', error);
    notifyClients('SYNC_FAILED', { error: error.message, timestamp: Date.now() });
  }
}

// Background GPS tracking function
async function backgroundGPSTracking() {
  try {
    console.log('Starting background GPS tracking...');
    
    // Get current tracking session
    const session = await getCurrentTrackingSession();
    
    if (session && session.isActive && !session.isPaused) {
      // Request location in background
      const position = await getCurrentPosition();
      
      if (position) {
        // Update session with new position
        const updatedSession = {
          ...session,
          positions: [...session.positions, position],
          lastUpdate: Date.now(),
          backgroundTracking: true
        };
        
        // Store updated session
        await storeTrackingSession(updatedSession);
        
        // Notify clients of background location update
        notifyClients('BACKGROUND_LOCATION_UPDATE', {
          position,
          sessionId: session.id,
          timestamp: Date.now()
        });
        
        console.log('Background location update completed');
      }
    }
    
  } catch (error) {
    console.error('Background GPS tracking failed:', error);
  }
}

// Keep alive sync function
async function keepAliveSync() {
  try {
    console.log('Keep alive sync triggered...');
    
    // Get current tracking session
    const session = await getCurrentTrackingSession();
    
    if (session && session.isActive) {
      // Update session with keep-alive timestamp
      const updatedSession = {
        ...session,
        lastUpdate: Date.now()
      };
      
      await storeTrackingSession(updatedSession);
      
      // Notify clients of keep-alive
      notifyClients('KEEP_ALIVE', {
        sessionId: session.id,
        timestamp: Date.now()
      });
    }
    
  } catch (error) {
    console.error('Keep alive sync failed:', error);
  }
}

// Message event handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'TRACKING_UPDATE':
      handleTrackingUpdate(data);
      break;
    case 'TRACKING_CLEAR':
      handleTrackingClear();
      break;
    case 'ENABLE_BACKGROUND_TRACKING':
      handleEnableBackgroundTracking(data);
      break;
    case 'KEEP_ALIVE':
      handleKeepAlive(data);
      break;
    case 'WAKE_LOCK_ACQUIRED':
      handleWakeLockAcquired(data);
      break;
    case 'WAKE_LOCK_RELEASED':
      handleWakeLockReleased(data);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Handle tracking update
function handleTrackingUpdate(data) {
  console.log('Handling tracking update:', data);
  
  // Store tracking data
  storeTrackingSession(data).then(() => {
    // If in background mode, start background tracking
    if (data.backgroundMode) {
      startBackgroundTracking(data.sessionId);
    }
  }).catch(error => {
    console.error('Failed to handle tracking update:', error);
  });
}

// Handle tracking clear
function handleTrackingClear() {
  console.log('Clearing tracking data...');
  
  // Clear stored tracking data
  clearStoredTrackingSession().then(() => {
    // Stop background tracking
    stopBackgroundTracking();
  }).catch(error => {
    console.error('Failed to clear tracking data:', error);
  });
}

// Handle enable background tracking
function handleEnableBackgroundTracking(data) {
  console.log('Enabling background tracking for session:', data.sessionId);
  
  // Start background tracking
  startBackgroundTracking(data.sessionId);
}

// Handle keep alive
function handleKeepAlive(data) {
  console.log('Keep alive received for session:', data.sessionId);
  
  // Update session with keep-alive timestamp
  getCurrentTrackingSession().then(session => {
    if (session && session.id === data.sessionId) {
      const updatedSession = {
        ...session,
        lastUpdate: Date.now()
      };
      
      storeTrackingSession(updatedSession);
    }
  }).catch(error => {
    console.error('Failed to handle keep alive:', error);
  });
}

// Handle wake lock acquired
function handleWakeLockAcquired(data) {
  console.log('Wake lock acquired:', data.type);
  
  // Notify clients
  notifyClients('WAKE_LOCK_ACQUIRED', {
    type: data.type,
    timestamp: Date.now()
  });
}

// Handle wake lock released
function handleWakeLockReleased(data) {
  console.log('Wake lock released');
  
  // Notify clients
  notifyClients('WAKE_LOCK_RELEASED', {
    timestamp: Date.now()
  });
}

// Start background tracking
function startBackgroundTracking(sessionId) {
  console.log('Starting background tracking for session:', sessionId);
  
  // Set up periodic background tracking
  const trackingInterval = setInterval(async () => {
    try {
      const session = await getCurrentTrackingSession();
      
      if (session && session.id === sessionId && session.isActive && !session.isPaused) {
        // Request location
        const position = await getCurrentPosition();
        
        if (position) {
          // Update session
          const updatedSession = {
            ...session,
            positions: [...session.positions, position],
            lastUpdate: Date.now(),
            backgroundTracking: true
          };
          
          await storeTrackingSession(updatedSession);
          
          // Notify clients
          notifyClients('BACKGROUND_LOCATION_UPDATE', {
            position,
            sessionId,
            timestamp: Date.now()
          });
        }
      } else {
        // Session no longer active, stop tracking
        clearInterval(trackingInterval);
      }
    } catch (error) {
      console.error('Background tracking error:', error);
    }
  }, BACKGROUND_CONFIG.trackingInterval);
  
  // Store interval reference
  self.backgroundTrackingIntervals = self.backgroundTrackingIntervals || {};
  self.backgroundTrackingIntervals[sessionId] = trackingInterval;
}

// Stop background tracking
function stopBackgroundTracking() {
  console.log('Stopping background tracking...');
  
  if (self.backgroundTrackingIntervals) {
    Object.values(self.backgroundTrackingIntervals).forEach(interval => {
      clearInterval(interval);
    });
    self.backgroundTrackingIntervals = {};
  }
}

// Get current position with timeout
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    const timeout = setTimeout(() => {
      reject(new Error('Geolocation timeout'));
    }, BACKGROUND_CONFIG.syncTimeout);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp
        });
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: BACKGROUND_CONFIG.syncTimeout,
        maximumAge: 0
      }
    );
  });
}

// Helper functions for GPS data storage (placeholder - would use IndexedDB in production)
async function getStoredGPSData() {
  // This would typically use IndexedDB
  return [];
}

async function removeStoredGPSData(id) {
  // This would typically use IndexedDB
  console.log('Removing GPS data:', id);
}

async function getCurrentTrackingSession() {
  // This would typically use IndexedDB
  return null;
}

async function storeTrackingSession(session) {
  // This would typically use IndexedDB
  console.log('Storing tracking session:', session.id);
}

async function clearStoredTrackingSession() {
  // This would typically use IndexedDB
  console.log('Clearing stored tracking session');
}

// Notify all clients
function notifyClients(type, data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    });
  });
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