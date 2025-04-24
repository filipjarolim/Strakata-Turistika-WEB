import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

// Add fetch event listener to handle failed image requests with a fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Only handle GET requests for Google user content images
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
              // Cache the fetched response
              const responseToCache = response.clone();
              caches.open('image-cache').then(cache => {
                cache.put(request, responseToCache);
              });
              
              return response;
            })
            .catch(() => {
              // Return transparent 1x1 pixel if fetch fails
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

serwist.addEventListeners(); 