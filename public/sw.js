// Basic Service Worker for Next.js with Auth and Homepage Caching
const CACHE_NAME = 'next-pwa-cache-v1';

// Add the routes you want to cache
const urlsToCache = [
  '/', // Homepage
  '/api/auth/session', // NextAuth session endpoint
  '/api/user', // User profile endpoint (if available)
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache important resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Skip waiting to immediately activate the service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell and content');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failure:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any old caches that aren't the current one
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients...');
      return self.clients.claim();
    })
  );
});

// Helper function to handle fetch with network-first strategy for dynamic API routes
const networkFirstWithCache = async (request) => {
  try {
    // Try the network first
    const networkResponse = await fetch(request);
    
    // If successful, clone the response to cache it
    const responseToCache = networkResponse.clone();
    
    // Open the cache and store the response
    caches.open(CACHE_NAME)
      .then((cache) => {
        cache.put(request, responseToCache);
      });
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failure, trying cache for', request.url);
    
    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If nothing in cache, return basic offline JSON for API routes or offline page
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'You are offline',
          isOffline: true,
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Return a basic offline page for non-API routes
    return caches.match('/');
  }
};

// Helper function for cache-first strategy for static assets
const cacheFirstWithNetwork = async (request) => {
  // Try the cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try the network
  try {
    const networkResponse = await fetch(request);
    
    // Clone and cache the response for future
    const responseToCache = networkResponse.clone();
    caches.open(CACHE_NAME)
      .then((cache) => {
        cache.put(request, responseToCache);
      });
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Both cache and network failed for', request.url);
    // If it's an image, you could return a placeholder image
    // For now, we'll just fail
    return new Response('Network error occurred', { status: 408 });
  }
};

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Handle same-origin requests only
  if (url.origin !== self.location.origin) return;
  
  // Special handling for API routes (network-first strategy)
  if (url.pathname.startsWith('/api/')) {
    // Special handling for auth-related API routes
    if (url.pathname.includes('/api/auth') || url.pathname.includes('/api/user')) {
      event.respondWith(networkFirstWithCache(request));
      return;
    }
  }
  
  // For the homepage, use network-first strategy to ensure fresh content
  if (url.pathname === '/') {
    event.respondWith(networkFirstWithCache(request));
    return;
  }
  
  // For other routes (static assets), use cache-first strategy
  event.respondWith(cacheFirstWithNetwork(request));
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 