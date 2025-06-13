import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string>;
};

// Background sync interval (in milliseconds)
const BACKGROUND_SYNC_INTERVAL = 10000; // 10 seconds

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

// Define a type for the tracking data
interface TrackingData {
  tracking: boolean;
  positions: Array<[number, number]>;
  startTime: number;
  elapsedTime: number;
  pauseDuration: number;
  isActive: boolean;
  isPaused: boolean;
}

// Add background sync support for GPS tracking
self.addEventListener('sync', (event: any) => {
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
          
          // Simplified data handling without complex types
          const data = await response.json();
          console.log('Syncing tracking data:', data);
          
          // Here you can add code to send the data to your server
          // For example:
          // await fetch('/api/saveTrack', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify(data)
          // });
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error syncing tracking data:', error);
          return Promise.reject(error);
        }
      })()
    );
  }
});

// Function to set up background location tracking
async function setupBackgroundTracking() {
  try {
    // Get the tracking state from IndexedDB or localStorage
    const data = await self.clients.matchAll({ type: 'window' })
      .then(async clients => {
        if (clients.length > 0) {
          // Try to get data from an active client
          const activeClient = clients[0];
          return activeClient.postMessage({ type: 'GET_TRACKING_DATA' });
        }
        return null;
      });
    
    // Simplified check without complex types
    if (!data) {
      return Promise.resolve();
    }
    
    console.log('Background tracking data:', data);
    return Promise.resolve();
  } catch (error) {
    console.error('Error in background tracking:', error);
    return Promise.resolve();
  }
}

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

// Listen for messages from clients (main thread)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRACKING_UPDATE') {
    // Store the updated tracking data for background sync
    console.log('Received tracking update:', event.data);
  }
});

serwist.addEventListeners(); 