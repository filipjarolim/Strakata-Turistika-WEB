import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Declare necessary types for Service Worker context and IndexedDB
declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string>;
};

const DB_NAME = 'gpsTrackerDB';
const DB_VERSION = 1; // Increment this if schema changes
const OFFLINE_TRACKS_STORE = 'offlineTracks';
const LOCATIONS_STORE = 'locations';

// --- IndexedDB Helper Functions ---
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(LOCATIONS_STORE)) {
        db.createObjectStore(LOCATIONS_STORE, { keyPath: 'id' });
        console.log(`Created ${LOCATIONS_STORE} store`);
      }
      if (!db.objectStoreNames.contains(OFFLINE_TRACKS_STORE)) {
        db.createObjectStore(OFFLINE_TRACKS_STORE, { keyPath: 'timestamp' });
        console.log(`Created ${OFFLINE_TRACKS_STORE} store`);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

async function getAllFromStore(storeName: string): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
     if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Store ${storeName} not found during getAll`);
        return resolve([]); // Return empty if store doesn't exist
     }
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = (event) => {
      console.error(`Error getting all from ${storeName}:`, (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}

async function addToStore(storeName: string, data: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
     if (!db.objectStoreNames.contains(storeName)) {
        console.error(`Store ${storeName} not found during add`);
        return reject(`Store ${storeName} not found`);
     }
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data); // Use put for add/update

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error(`Error adding to ${storeName}:`, (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
     if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Store ${storeName} not found during clear`);
        return resolve(); // Nothing to clear
     }
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event) => {
      console.error(`Error clearing ${storeName}:`, (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
}

// --- Serwist Configuration ---
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

// --- Event Listeners ---

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

// Background Sync: Upload offline tracks
self.addEventListener('sync', (event) => {
  if (event.tag === 'gps-tracking') {
    console.log('Service Worker: Received sync event for gps-tracking');
    event.waitUntil(
      (async () => {
        try {
          const offlineTracks = await getAllFromStore(OFFLINE_TRACKS_STORE);
          
          if (offlineTracks && offlineTracks.length > 0) {
            console.log(`Service Worker: Found ${offlineTracks.length} tracks to sync.`);
            const response = await fetch('/api/sync-gps-data', { // Ensure this endpoint exists and handles an array
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(offlineTracks),
            });
            
            if (response.ok) {
              console.log('Service Worker: Offline GPS data synced successfully via background sync.');
              await clearStore(OFFLINE_TRACKS_STORE);
              console.log(`Service Worker: Cleared ${OFFLINE_TRACKS_STORE} store.`);
            } else {
               console.error('Service Worker: Background sync failed. Server response not OK:', response.status, response.statusText);
               // Optional: Check response body for details
               // const errorBody = await response.text();
               // console.error('Sync error body:', errorBody);
            }
          } else {
             console.log('Service Worker: No offline GPS tracks found to sync.');
          }
        } catch (error) {
          console.error('Service Worker: Error during background sync process:', error);
        }
      })()
    );
  } else {
     console.log(`Service Worker: Received sync event for tag: ${event.tag}`);
     // Handle other sync tags if necessary
  }
});

// Message Listener: Store incoming offline tracks or last location
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
     console.log(`Service Worker: Received message type: ${event.data.type}`);
     switch (event.data.type) {
        case 'STORE_OFFLINE_TRACK':
          const trackData = event.data.data;
          if (trackData && trackData.timestamp) {
             addToStore(OFFLINE_TRACKS_STORE, trackData)
               .then(() => console.log(`Service Worker: Stored track data (ts: ${trackData.timestamp}) in IndexedDB.`))
               .catch(err => console.error('Service Worker: Failed to store offline track data:', err));
          } else {
             console.warn('Service Worker: Received invalid track data for STORE_OFFLINE_TRACK.', trackData);
          }
          break;
        case 'SAVE_LAST_LOCATION':
           const locationData = event.data.data;
           if (locationData && locationData.lat !== undefined && locationData.lng !== undefined) {
              addToStore(LOCATIONS_STORE, { id: 'lastKnown', ...locationData })
                .then(() => console.log(`Service Worker: Stored last location in IndexedDB.`))
                .catch(err => console.error('Service Worker: Failed to store last location:', err));
           } else {
              console.warn('Service Worker: Received invalid data for SAVE_LAST_LOCATION.', locationData);
           }
           break;
        // Add other message types if needed
        default:
           console.log('Service Worker: Received unhandled message type.');
     }
  }
});

serwist.addEventListeners(); 