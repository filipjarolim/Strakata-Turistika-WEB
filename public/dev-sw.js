/**
 * Development service worker for Strakatá turistika
 * This is a simplified service worker used during development
 */

// Skip waiting to ensure the latest service worker is activated immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Development service worker installed');
});

// Claim clients to ensure service worker controls all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('Development service worker activated and claimed clients');
    })
  );
});

// Basic offline fallback for navigation requests
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If fetch fails (offline), return the offline page
          return caches.match('/offline') || 
                 new Response('You are offline. Please check your connection.', {
                   headers: { 'Content-Type': 'text/html' }
                 });
        })
    );
  }
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('Dev service worker received message:', event.data);
  
  // Echo back online status to client
  if (event.data && event.data.type === 'CHECK_ONLINE_STATUS') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'CONNECTION_STATUS',
          isOffline: !navigator.onLine
        });
      });
    });
  }
}); 