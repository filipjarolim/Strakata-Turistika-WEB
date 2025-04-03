/**
 * Simplified Service Worker for Strakatá turistika
 */

import { Serwist } from 'serwist';
import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching, RouteHandler } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// Service worker instance
declare const self: ServiceWorkerGlobalScope;

// Cache names
const CACHE_NAMES = {
  DYNAMIC: 'dynamic-data-v2',
  STATIC: 'static-resources-v2',
  API: 'api-responses-v2',
  MAP_TILES: 'map-tiles-v2'
};

// Initialize Serwist with configuration
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      urlPattern: new RegExp('^https://(tile\\.openstreetmap\\.org|server\\.arcgisonline\\.com|tile\\.opentopomap\\.org)'),
      handler: ('CacheFirst' as unknown) as RouteHandler,
      options: {
        cacheName: CACHE_NAMES.MAP_TILES,
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: new RegExp('/api/'),
      handler: ('NetworkFirst' as unknown) as RouteHandler,
      options: {
        cacheName: CACHE_NAMES.API,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: ({ request }: { request: Request }) => 
        ['style', 'script', 'font', 'image'].includes(request.destination),
      handler: ('StaleWhileRevalidate' as unknown) as RouteHandler,
      options: {
        cacheName: CACHE_NAMES.STATIC,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ] as RuntimeCaching[],
  fallbacks: {
    entries: [{
      url: '/offline',
      matcher: ({request}: {request: Request}) => request.destination === 'document'
    }]
  }
});

// Add event listeners for Serwist
serwist.addEventListeners();

// Cache a specific URL and update progress
async function cacheUrl(url: string, cacheName = CACHE_NAMES.DYNAMIC): Promise<boolean> {
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
async function handleManualCaching(pages: string[], assets: string[]): Promise<void> {
  let cached = 0;
  const total = pages.length + assets.length;
  const progress: Array<{ url: string; status: 'pending' | 'cached' | 'error' }> = 
    pages.map(url => ({ url, status: 'pending' }));
  
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
