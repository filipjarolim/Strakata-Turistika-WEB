import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache map tiles with a network-first strategy
    {
      matcher: ({ url }) => {
        return url.hostname.includes('tile.openstreetmap.org') || 
               url.hostname.includes('server.arcgisonline.com');
      },
      handler: new CacheFirst({
        cacheName: 'map-tiles',
        plugins: [
          new ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
    // Cache the competition page with a network-first strategy
    {
      matcher: ({ url }) => {
        return url.pathname === '/soutez';
      },
      handler: new NetworkFirst({
        cacheName: 'competition-page',
        plugins: [
          new ExpirationPlugin({
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // Default cache for other assets
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
      {
        url: '/offline-map',
        matcher({ request }) {
          return request.url.includes('tile.openstreetmap.org') || 
                 request.url.includes('server.arcgisonline.com');
        },
      },
    ],
  },
});

// Add fetch event listener to handle failed image requests with a fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle map tile requests
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('server.arcgisonline.com')) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Update cache in the background
            fetch(request)
              .then(response => {
                if (response.ok) {
                  caches.open('map-tiles').then(cache => {
                    cache.put(request, response);
                  });
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          
          return fetch(request)
            .then(response => {
              if (response.ok) {
                const responseToCache = response.clone();
                caches.open('map-tiles').then(cache => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            })
            .catch(() => {
              // Return a placeholder tile for offline use
              return new Response(
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                {
                  headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'no-cache',
                  },
                }
              );
            });
        })
    );
  }
  
  // Handle competition page requests
  if (url.pathname === '/soutez') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open('competition-page').then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineResponse = await caches.match('/offline');
          if (offlineResponse) {
            return offlineResponse;
          }
          return new Response('Offline page not found', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
  }
  
  // Handle other image requests
  if (request.method === 'GET' && 
      (url.hostname.includes('googleusercontent.com') || 
       url.pathname.startsWith('/_next/image'))) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then(response => {
              if (response.ok) {
                const responseToCache = response.clone();
                caches.open('image-cache').then(cache => {
                  cache.put(request, responseToCache);
                });
              }
              return response;
            })
            .catch(() => {
              return new Response(
                'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                {
                  headers: {
                    'Content-Type': 'image/gif',
                    'Cache-Control': 'no-cache',
                  },
                }
              );
            });
        })
    );
  }
});

// Add background sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'gps-tracking') {
    event.waitUntil(
      (async () => {
        try {
          const db = await initDB();
          const transaction = db.transaction(['tracks'], 'readonly');
          const store = transaction.objectStore('tracks');
          const request = store.getAll();

          const positions = await new Promise<any[]>((resolve) => {
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
          });

          if (positions.length > 0) {
            const response = await fetch('/api/sync-gps-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(positions),
            });
            
            if (response.ok) {
              // Clear synced positions
              const clearTransaction = db.transaction(['tracks'], 'readwrite');
              const clearStore = clearTransaction.objectStore('tracks');
              positions.forEach(pos => clearStore.delete(pos.timestamp));
            }
          }
        } catch (error) {
          console.error('Failed to sync GPS data:', error);
        }
      })()
    );
  }
});

// Initialize IndexedDB in service worker
const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('gpsTrackerDB', 1);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('tracks')) {
        db.createObjectStore('tracks', { keyPath: 'timestamp' });
      }
    };
  });
};

// Add message event listener for offline storage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SAVE_FOR_OFFLINE') {
    const { url, data } = event.data;
    
    // Store in IndexedDB
    const openRequest = indexedDB.open('gpsTrackerDB', 1);
    
    openRequest.onupgradeneeded = function() {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tracks')) {
        db.createObjectStore('tracks', { keyPath: 'timestamp' });
      }
    };
    
    openRequest.onsuccess = function() {
      const db = openRequest.result;
      const transaction = db.transaction(['locations', 'tracks'], 'readwrite');
      const locationStore = transaction.objectStore('locations');
      const trackStore = transaction.objectStore('tracks');
      
      // Store location
      locationStore.put({
        id: 'lastKnown',
        ...data,
        timestamp: Date.now()
      });
      
      // Store track data if available
      if (data.positions && data.positions.length > 0) {
        trackStore.put({
          timestamp: data.timestamp,
          positions: data.positions,
          elapsedTime: data.elapsedTime,
          maxSpeed: data.maxSpeed,
          totalAscent: data.totalAscent,
          totalDescent: data.totalDescent
        });
      }
    };
  }
});

serwist.addEventListeners(); 