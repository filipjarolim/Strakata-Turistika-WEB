// Service Worker for offline GPS tracking app
// This file handles offline caching, background sync, and push notifications

const CACHE_NAME = 'gps-tracker-v1';
const OFFLINE_CACHE = 'gps-offline-v1';
const STATIC_CACHE = 'gps-static-v1';

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
      })
    ]).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service worker install failed:', error);
      // Don't fail the install, just log the error
      return self.skipWaiting();
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
                cacheName !== STATIC_CACHE) {
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

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: try network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(response => {
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
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

// Handle API requests with offline queue
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // If successful, sync any offline data
    if (response.ok) {
      await syncOfflineData();
    }
    
    return response;
  } catch (error) {
    // Network failed, queue for later sync
    await queueOfflineRequest(request);
    
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({ 
      error: 'Offline mode', 
      message: 'Data will sync when connection is restored' 
    }), {
      status: 503,
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
    
    // Fallback offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - GPS Tracker</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui; padding: 2rem; text-align: center; }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📡</div>
          <h1>You're Offline</h1>
          <p>GPS tracking continues to work offline. Data will sync when connection is restored.</p>
          <button onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
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

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'GPS tracking update',
    icon: '/images/marker-icon.png',
    badge: '/images/marker-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Route',
        icon: '/images/marker-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/marker-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('GPS Tracker', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/soutez/gps')
    );
  }
});

// Queue offline requests for later sync
async function queueOfflineRequest(request) {
  const offlineQueue = await getOfflineQueue();
  
  const queueItem = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: Date.now()
  };
  
  offlineQueue.push(queueItem);
  await setOfflineQueue(offlineQueue);
}

// Sync offline data when online
async function syncOfflineData() {
  const offlineQueue = await getOfflineQueue();
  
  if (offlineQueue.length === 0) {
    return;
  }
  
  const syncedItems = [];
  
  for (const item of offlineQueue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });
      
      if (response.ok) {
        syncedItems.push(item);
      }
    } catch (error) {
      console.error('Failed to sync item:', error);
    }
  }
  
  // Remove synced items from queue
  const remainingItems = offlineQueue.filter(item => 
    !syncedItems.some(synced => synced.timestamp === item.timestamp)
  );
  
  await setOfflineQueue(remainingItems);
  
  // Notify clients of sync completion
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      syncedCount: syncedItems.length,
      remainingCount: remainingItems.length
    });
  });
}

// Get offline queue from IndexedDB
async function getOfflineQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open('GPSOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'timestamp' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineQueue'], 'readonly');
      const store = transaction.objectStore('offlineQueue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        resolve([]);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

// Set offline queue in IndexedDB
async function setOfflineQueue(queue) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GPSOfflineDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineQueue')) {
        db.createObjectStore('offlineQueue', { keyPath: 'timestamp' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['offlineQueue'], 'readwrite');
      const store = transaction.objectStore('offlineQueue');
      
      // Clear existing queue
      store.clear();
      
      // Add new items
      queue.forEach(item => {
        store.add(item);
      });
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_OFFLINE_QUEUE') {
    getOfflineQueue().then(queue => {
      event.ports[0].postMessage({ queue });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_OFFLINE_QUEUE') {
    setOfflineQueue([]).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  // Handle GPS tracking updates
  if (event.data && event.data.type === 'TRACKING_UPDATE') {
    console.log('Received tracking update:', event.data);
    // Store tracking data in cache for offline sync
    caches.open('gps-tracking-cache').then(cache => {
      cache.put('tracking-data', new Response(JSON.stringify(event.data)));
    });
  }
});

// Handle background sync for GPS data
self.addEventListener('sync', (event) => {
  if (event.tag === 'gps-tracking-sync') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open('gps-tracking-cache');
          const response = await cache.match('tracking-data');
          
          if (!response) {
            console.log('No tracking data found in cache');
            return Promise.resolve();
          }
          
          const data = await response.json();
          console.log('Syncing tracking data:', data);
          
          // Here you would send the data to your server
          // For now, just log it
          return Promise.resolve();
        } catch (error) {
          console.error('Error syncing tracking data:', error);
          return Promise.reject(error);
        }
      })()
    );
  }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(syncOfflineData());
    }
  });
} 