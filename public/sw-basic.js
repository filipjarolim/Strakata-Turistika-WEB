/**
 * Basic Service Worker for Strakatá turistika
 */

// Cache names
const CACHE_NAMES = {
  DYNAMIC: 'dynamic-data-v2',
  STATIC: 'static-resources-v2',
  API: 'api-responses-v2',
  MAP_TILES: 'map-tiles-v2'
};

// Pages to cache for offline access
const PAGES_TO_CACHE = [
  '/',
  '/playground',
  '/pravidla',
  '/vysledky',
  '/offline',
  '/login',
  '/profile',
  '/prihlaseni'
];

// Critical assets
const CRITICAL_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/dog_emoji.png',
  '/manifest.json',
  '/favicon.ico',
  '/icons/transparent-header.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll(['/offline', ...CRITICAL_ASSETS]);
    })
  );
  
  self.skipWaiting();
});

// Activate event - claim clients and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // If key doesn't match our cache names, delete it
          if (!Object.values(CACHE_NAMES).includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated and cleaned up old caches');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for most resources, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle map tiles (cache first)
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('server.arcgisonline.com') ||
      url.hostname.includes('tile.opentopomap.org')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          // Save the response to cache for future use
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAMES.MAP_TILES).then((cache) => {
            cache.put(request, clonedResponse);
          });
          return networkResponse;
        });
      }).catch(() => {
        // Fallback for offline map tiles
        return new Response('Offline map tile', { status: 503 });
      })
    );
    return;
  }
  
  // Handle API requests (network first)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        // Save the response to cache for future use
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAMES.API).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return networkResponse;
      }).catch(() => {
        // Try to get from cache if network fails
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback for API requests when offline and not cached
          return new Response(JSON.stringify({ 
            offline: true, 
            message: 'No cached data available' 
          }), { 
            headers: { 'Content-Type': 'application/json' } 
          });
        });
      })
    );
    return;
  }
  
  // For navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        // Clone the response and put in cache
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAMES.STATIC).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return networkResponse;
      }).catch(() => {
        // If network fails, try the cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache, return offline page
          return caches.match('/offline');
        });
      })
    );
    return;
  }
  
  // For all other requests (assets, etc)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise try network and cache the result
      return fetch(request).then((networkResponse) => {
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAMES.STATIC).then((cache) => {
          cache.put(request, clonedResponse);
        });
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail, return appropriate fallback
        if (request.destination === 'image') {
          return new Response('Image placeholder', { status: 503 });
        }
        return new Response('Resource unavailable', { status: 503 });
      });
    })
  );
});

// Cache a specific URL and update progress
async function cacheUrl(url, cacheName = CACHE_NAMES.DYNAMIC) {
  try {
    const cache = await caches.open(cacheName);
    const response = await fetch(new Request(url, { cache: 'reload' }));
    
    if (response.status === 200) {
      await cache.put(url, response);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to cache ${url}:`, error);
    return false;
  }
}

// Handle manual caching request from the client
async function handleManualCaching(pages, assets) {
  let cached = 0;
  const total = pages.length + assets.length;
  const progress = pages.map(url => ({ url, status: 'pending' }));
  
  // Helper function to update progress
  const updateProgress = () => {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CACHE_PROGRESS',
          cached,
          total,
          pages: progress
        });
      });
    });
  };

  // Cache pages first
  for (const url of pages) {
    const success = await cacheUrl(url);
    const pageProgress = progress.find(p => p.url === url);
    if (pageProgress) {
      pageProgress.status = success ? 'cached' : 'error';
    }
    if (success) cached++;
    updateProgress();
  }

  // Then cache assets
  for (const asset of assets) {
    const success = await cacheUrl(asset);
    if (success) cached++;
    updateProgress();
  }

  // Notify completion
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_COMPLETE'
      });
    });
  });
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
  // Handle manual caching request
  if (event.data && event.data.type === 'START_CACHING') {
    event.waitUntil(handleManualCaching(event.data.pages, event.data.assets));
  }
}); 