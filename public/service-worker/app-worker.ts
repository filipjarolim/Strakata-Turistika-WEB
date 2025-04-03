/**
 * Strakatá turistika Service Worker
 * A comprehensive PWA implementation with offline support, background sync,
 * and intelligent caching strategies
 */

import { 
  Serwist,
  type RouteHandlerObject,
  type PrecacheEntry, 
  type SerwistGlobalConfig, 
  type RouteHandler, 
  type Strategy,
  type RuntimeCaching
} from 'serwist';
import { defaultCache } from '@serwist/next/worker';

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

// =============================================================================
// CONFIGURATION
// =============================================================================

// Critical pages to cache for offline access
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

// Critical assets that should be available offline
const CRITICAL_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/dog_emoji.png',
  '/manifest.json',
  '/favicon.ico',
  '/icons/transparent-header.png'
];

// API endpoints that should be cached for offline access
const CACHE_API_ENDPOINTS = [
  '/api/seasons',
  '/api/results',
  '/api/user/results'
];

// Cache names
const CACHE_NAMES = {
  DYNAMIC: 'dynamic-data-v2',
  STATIC: 'static-resources-v2',
  API: 'api-responses-v2',
  RESULTS: 'results-data-v2',
  USER: 'user-data-v2',
  MAP_TILES: 'map-tiles-v2'
};

// TTL values in milliseconds for different cache types
const CACHE_TTL = {
  SEASONS: 24 * 60 * 60 * 1000,    // 24 hours
  RESULTS: 60 * 60 * 1000,         // 1 hour
  USER_DATA: 5 * 60 * 1000,        // 5 minutes
  API: 15 * 60 * 1000,             // 15 minutes
  BACKGROUND_REFRESH: 5 * 60 * 1000 // 5 minutes
};

// Network timeout for API requests in milliseconds
const NETWORK_TIMEOUT = 5000; // 5 seconds

// =============================================================================
// DATA INTERFACES
// =============================================================================

// Interface for location data
interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

// Interface for track data
interface TrackData {
  season: number;
  image: string | null;
  distance: string;
  elapsedTime: number;
  averageSpeed: string;
  fullName: string;
  maxSpeed: string;
  totalAscent: string;
  totalDescent: string;
  timestamp: number;
  positions: [number, number][];
}

// Interface for cached responses with timestamps
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

// Network conditions tracker
interface NetworkStatus {
  isOffline: boolean;
  isSlowConnection: boolean;
  latency: number;
  lastChecked: number;
}

// =============================================================================
// GLOBAL STATE
// =============================================================================

// Keep track of network conditions
const networkStatus: NetworkStatus = {
  isOffline: false,
  isSlowConnection: false,
  latency: 0,
  lastChecked: 0
};

// Track of when endpoints were refreshed
const refreshTimestamps = new Map<string, number>();

// Current app version - increment this when making major changes
const APP_VERSION = 2;

// Background sync queue for data that needs to be sent when online
const syncQueue: Array<{url: string, method: string, body: any, timestamp: number}> = [];

// =============================================================================
// SERWIST CONFIGURATION
// =============================================================================

interface HandlerContext {
    request: Request;
    event?: FetchEvent;
}

// Configure caching strategies for different types of resources
const runtimeCachingOptions = [
    ...defaultCache,
    {
        urlPattern: /^https:\/\/(?:tile\.openstreetmap\.org|server\.arcgisonline\.com|tile\.opentopomap\.org)/i,
        handler: {
            handle: async ({ request }: HandlerContext): Promise<Response> => {
                const cache = await caches.open(CACHE_NAMES.MAP_TILES);
                const response = await cache.match(request);
                return response || fetch(request);
            }
        },
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
        urlPattern: /\/api\//,
        handler: {
            handle: async ({ request }: HandlerContext): Promise<Response> => {
                try {
                    return await fetch(request);
                } catch (error) {
                    const cache = await caches.open(CACHE_NAMES.API);
                    const response = await cache.match(request);
                    if (!response) {
                        throw new Error('No cached response available');
                    }
                    return response;
                }
            }
        },
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
            request.destination === 'style' || 
            request.destination === 'script' || 
            request.destination === 'font' ||
            request.destination === 'image',
        handler: {
            handle: async ({ request }: HandlerContext): Promise<Response> => {
                const cache = await caches.open(CACHE_NAMES.STATIC);
                const response = await cache.match(request);
                
                const fetchAndCache = async () => {
                    const networkResponse = await fetch(request);
                    await cache.put(request, networkResponse.clone());
                    return networkResponse;
                };
                
                return response || fetchAndCache();
            }
        },
        options: {
            cacheName: CACHE_NAMES.STATIC,
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
            },
        },
    },
] as RuntimeCaching[];

// Initialize Serwist with our configuration
const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: runtimeCachingOptions,
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

// Add event listeners for Serwist
serwist.addEventListeners();

// =============================================================================
// NETWORK UTILITIES
// =============================================================================

/**
 * Check the current network conditions
 * @returns Current network status information
 */
async function checkNetworkConditions(): Promise<NetworkStatus> {
  const now = Date.now();
  
  // Don't check too frequently (max once every 30 seconds)
  if (now - networkStatus.lastChecked < 30000) {
    return networkStatus;
  }
  
  // Update the last checked timestamp
  networkStatus.lastChecked = now;
  
  try {
    // Try to fetch a small resource to test connectivity
    const startTime = performance.now();
    const response = await fetch('/api/ping', { 
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const endTime = performance.now();
    
    // Calculate network latency
    const latency = endTime - startTime;
    
    // Update network status
    networkStatus.isOffline = false;
    networkStatus.isSlowConnection = latency > 2000; // Consider slow if > 2 seconds
    networkStatus.latency = latency;
    
    return networkStatus;
  } catch (error) {
    // If fetch fails, we're likely offline
    networkStatus.isOffline = true;
    networkStatus.isSlowConnection = true;
    
    return networkStatus;
  }
}

/**
 * Dispatch network status changes to all clients
 */
async function broadcastNetworkStatus() {
  const status = await checkNetworkConditions();
  const clients = await self.clients.matchAll();
  
  clients.forEach(client => {
    client.postMessage({
      type: 'NETWORK_STATUS_UPDATE',
      isOffline: status.isOffline,
      isSlowConnection: status.isSlowConnection,
      latency: status.latency
    });
  });
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Get a timestamped response from the cache if available and still valid
 * @param request The request to match
 * @param cacheName The cache to check
 * @param maxAge Maximum age in milliseconds
 * @returns The cached response or null
 */
async function getValidCachedResponse(
  request: Request,
  cacheName: string,
  maxAge: number
): Promise<Response | null> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    return null;
  }
  
  try {
    const data = await cachedResponse.clone().json();
    
    // Check if the cache entry has a timestamp and is still valid
    if (data.timestamp && Date.now() - data.timestamp < maxAge) {
      return cachedResponse;
    }
    
    // If the entry is stale but we're offline, still return it
    if (networkStatus.isOffline) {
      return cachedResponse;
    }
  } catch (error) {
    // If we can't parse the response, assume it's not valid
    return null;
  }
  
  return null;
}

/**
 * Cache a response with a timestamp
 * @param request The request to cache
 * @param response The response to cache
 * @param cacheName The cache to use
 */
async function cacheResponseWithTimestamp(
  request: Request,
  response: Response,
  cacheName: string
): Promise<void> {
  const cache = await caches.open(cacheName);
  
  try {
    const data = await response.clone().json();
    
    // Add timestamp and version to the data
    const enhancedData = {
      ...data,
      timestamp: Date.now(),
      version: APP_VERSION
    };
    
    // Create a new response with the enhanced data
    const enhancedResponse = new Response(JSON.stringify(enhancedData), {
      headers: new Headers(response.headers)
    });
    
    // Cache the enhanced response
    await cache.put(request, enhancedResponse);
    
    // Update the refresh timestamp
    refreshTimestamps.set(request.url, Date.now());
  } catch (error) {
    // If we can't parse the response, cache it as-is
    await cache.put(request, response.clone());
  }
}

/**
 * Clean up old caches that are no longer needed
 */
async function cleanupCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  const validCacheNames = Object.values(CACHE_NAMES);
  
  const oldCaches = cacheNames.filter(name => !validCacheNames.includes(name));
  
  await Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
}

// =============================================================================
// API HANDLERS
// =============================================================================

/**
 * Handle requests for season data with optimized caching
 * @param request The original request
 * @returns Cached response or network response
 */
async function handleSeasonsRequest(request: Request): Promise<Response> {
  const cacheName = CACHE_NAMES.API;
  const maxAge = CACHE_TTL.SEASONS;
  
  // Check if we have a valid cached response
  const cachedResponse = await getValidCachedResponse(request, cacheName, maxAge);
  if (cachedResponse) {
    // Background refresh if it's been a while
    const refreshThreshold = refreshTimestamps.get(request.url) || 0;
    if (Date.now() - refreshThreshold > CACHE_TTL.BACKGROUND_REFRESH) {
      backgroundRefresh(request, cacheName);
    }
    return cachedResponse;
  }
  
  try {
    // Fetch fresh data from network
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache the response
    await cacheResponseWithTimestamp(request, networkResponse.clone(), cacheName);
    
    return networkResponse;
  } catch (error) {
    console.error(`Failed to fetch seasons data: ${error}`);
    
    // If network request fails, try to return any cached response regardless of age
    const cache = await caches.open(cacheName);
    const staleCachedResponse = await cache.match(request);
    
    if (staleCachedResponse) {
      return staleCachedResponse;
    }
    
    // If no cached data at all, return an offline response
    return new Response(JSON.stringify({
      offline: true,
      cached: false,
      message: "No seasons data available offline"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle requests for results data with optimized caching
 * @param request The original request
 * @returns Cached response or network response
 */
async function handleResultsRequest(request: Request): Promise<Response> {
  const cacheName = CACHE_NAMES.RESULTS;
  const maxAge = CACHE_TTL.RESULTS;
  
  // Check if we have a valid cached response
  const cachedResponse = await getValidCachedResponse(request, cacheName, maxAge);
  if (cachedResponse) {
    // Background refresh if it's been a while
    const refreshThreshold = refreshTimestamps.get(request.url) || 0;
    if (Date.now() - refreshThreshold > CACHE_TTL.BACKGROUND_REFRESH) {
      backgroundRefresh(request, cacheName);
    }
    return cachedResponse;
  }
  
  try {
    // Fetch fresh data from network
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache the response
    await cacheResponseWithTimestamp(request, networkResponse.clone(), cacheName);
    
    return networkResponse;
  } catch (error) {
    console.error(`Failed to fetch results data: ${error}`);
    
    // If network request fails, try to return any cached response regardless of age
    const cache = await caches.open(cacheName);
    const staleCachedResponse = await cache.match(request);
    
    if (staleCachedResponse) {
      return staleCachedResponse;
    }
    
    // If no cached data at all, return an offline response
    return new Response(JSON.stringify({
      offline: true,
      cached: false,
      message: "No results data available offline"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle requests for user-specific data with optimized caching
 * @param request The original request
 * @returns Cached response or network response
 */
async function handleUserDataRequest(request: Request): Promise<Response> {
  const cacheName = CACHE_NAMES.USER;
  const maxAge = CACHE_TTL.USER_DATA;
  
  // Check if we have a valid cached response
  const cachedResponse = await getValidCachedResponse(request, cacheName, maxAge);
                if (cachedResponse) {
    // Background refresh if it's been a while
    const refreshThreshold = refreshTimestamps.get(request.url) || 0;
    if (Date.now() - refreshThreshold > CACHE_TTL.BACKGROUND_REFRESH) {
      backgroundRefresh(request, cacheName);
    }
                    return cachedResponse;
                }
                
  try {
    // Fetch fresh data from network
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cache the response
    await cacheResponseWithTimestamp(request, networkResponse.clone(), cacheName);
    
    return networkResponse;
  } catch (error) {
    console.error(`Failed to fetch user data: ${error}`);
    
    // If network request fails, try to return any cached response regardless of age
    const cache = await caches.open(cacheName);
    const staleCachedResponse = await cache.match(request);
    
    if (staleCachedResponse) {
      return staleCachedResponse;
    }
    
    // If no cached data at all, return an offline response
    return new Response(JSON.stringify({
      offline: true,
      cached: false,
      message: "No user data available offline"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle location data requests
 * @param request The original request
 * @returns Fresh response with offline fallback
 */
async function handleLocationRequest(request: Request): Promise<Response> {
    try {
        // Try network first
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
        
        // Clone the response before using it
        const responseToCache = networkResponse.clone();
        
        // Cache the fresh data
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
        await cache.put(request, responseToCache);
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache if network fails
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
    const cachedResponse = await cache.match(request);
    
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If no cached data, return empty but valid JSON
        return new Response(JSON.stringify({
            offline: true,
            cached: false,
            message: "No location data available offline"
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// =============================================================================
// SYNC & BACKGROUND OPERATIONS
// =============================================================================

/**
 * Perform a background refresh of cached data
 * @param request The request to refresh
 * @param cacheName The cache to update
 */
async function backgroundRefresh(request: Request, cacheName: string): Promise<void> {
  try {
    // Fetch fresh data
    const networkResponse = await fetchWithTimeout(request.clone(), NETWORK_TIMEOUT);
    
    if (networkResponse.ok) {
      // Cache the fresh response
      await cacheResponseWithTimestamp(request, networkResponse, cacheName);
      
      // Update refresh timestamp
      refreshTimestamps.set(request.url, Date.now());
      
      // Notify clients about the updated cache
      notifyClientsAboutCachedResources();
    }
  } catch (error) {
    console.warn(`Background refresh failed for ${request.url}: ${error}`);
  }
}

/**
 * Sync pending track data when coming back online
 */
async function syncPendingTrackData(): Promise<void> {
  try {
    // Check if we have cached sync data
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
        const pendingDataRequest = new Request('/pending-gps-data');
        const response = await cache.match(pendingDataRequest);
        
        if (response) {
            const pendingData = await response.json() as TrackData[];
            
            // Send the data to the server
            if (pendingData && pendingData.length > 0) {
                const serverResponse = await fetch('/api/saveTrack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingData),
                });
                
                if (serverResponse.ok) {
                    // Clear the pending data after successful sync
                    await cache.delete(pendingDataRequest);
                    
                    // Notify clients
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => {
                        client.postMessage({
                            type: "SYNC_COMPLETED",
                            success: true
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error syncing GPS data:', error);
    }
}

/**
 * Save data for offline use
 * @param url URL to use as cache key
 * @param data Data to cache
 */
async function saveDataForOffline(url: string, data: any): Promise<void> {
  const cache = await caches.open(CACHE_NAMES.DYNAMIC);
  const response = new Response(JSON.stringify({
    ...data,
    timestamp: Date.now(),
    version: APP_VERSION
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  await cache.put(new Request(url), response);
}

/**
 * Process any pending sync requests
 */
async function processSyncQueue(): Promise<void> {
  // Make a copy of the queue and empty the original
  const queueCopy = [...syncQueue];
  syncQueue.length = 0;
  
  for (const item of queueCopy) {
    try {
      // Try to send the request now
      await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.body)
      });
    } catch (error) {
      console.error(`Failed to sync request to ${item.url}:`, error);
      // Put it back in the queue if still recent (less than 24 hours old)
      if (Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
        syncQueue.push(item);
      }
    }
  }
  
  // Save the updated queue
  await saveDataForOffline('/sync-queue', syncQueue);
}

/**
 * Prefetch critical API endpoints
 */
async function prefetchCriticalData(): Promise<void> {
  try {
    await Promise.all(CACHE_API_ENDPOINTS.map(async (endpoint) => {
      try {
        const request = new Request(endpoint, { cache: 'reload' });
        
        // Determine which cache to use based on the endpoint
        let cacheName = CACHE_NAMES.API;
        if (endpoint.includes('/results')) {
          cacheName = CACHE_NAMES.RESULTS;
        } else if (endpoint.includes('/user')) {
          cacheName = CACHE_NAMES.USER;
        }
        
        // Fetch the data
        const response = await fetchWithTimeout(request, NETWORK_TIMEOUT);
        
        if (response.ok) {
          // Cache the response
          await cacheResponseWithTimestamp(request, response, cacheName);
          console.log(`Prefetched and cached: ${endpoint}`);
        }
      } catch (error) {
        console.warn(`Failed to prefetch ${endpoint}:`, error);
      }
    }));
  } catch (error) {
    console.error('Failed to prefetch critical data:', error);
  }
}

// =============================================================================
// NOTIFICATION MANAGEMENT
// =============================================================================

/**
 * Create a persistent notification
 * @param data Notification data
 */
async function createPersistentNotification(data: any): Promise<void> {
  await self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
    tag: data.tag,
                    requireInteraction: true,
                    data: {
                        url: '/playground',
                        trackingActive: true
                    }
  });
}

/**
 * Update an existing notification
 * @param data Updated notification data
 */
async function updatePersistentNotification(data: any): Promise<void> {
  const notifications = await self.registration.getNotifications({ tag: data.tag });
  
                    if (notifications.length > 0) {
    // Close existing notifications with this tag
                        notifications.forEach(notification => notification.close());
                        
    // Create a new notification with updated data
    await createPersistentNotification(data);
  }
}

/**
 * Close a persistent notification
 * @param tag Notification tag to close
 */
async function closePersistentNotification(tag: string): Promise<void> {
  const notifications = await self.registration.getNotifications({ tag });
  notifications.forEach(notification => notification.close());
}

// =============================================================================
// CLIENT COMMUNICATION
// =============================================================================

/**
 * Notify clients about what resources are cached
 */
async function notifyClientsAboutCachedResources(): Promise<void> {
  try {
    // Get all cached API endpoints
    const apiEndpoints: string[] = [];
    
    for (const cacheName of [CACHE_NAMES.API, CACHE_NAMES.RESULTS, CACHE_NAMES.USER]) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const request of keys) {
        if (request.url.includes('/api/')) {
          apiEndpoints.push(request.url);
        }
      }
    }
    
    // Report to all clients
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({ 
        type: "UPDATE_CACHED_API_ENDPOINTS", 
        endpoints: apiEndpoints,
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error("Error reporting cached API endpoints:", error);
  }
}

/**
 * Report offline changes that have been made while disconnected
 */
async function reportOfflineChanges(): Promise<void> {
  try {
    // Read any pending changes from the cache
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
    const response = await cache.match(new Request('/offline-changes'));
    
    if (response) {
      const changes = await response.json();
      
      // Report to all clients
      const clients = await self.clients.matchAll();
      
      clients.forEach(client => {
        client.postMessage({ 
          type: "OFFLINE_CHANGES_PENDING", 
          changes,
          count: changes.length
        });
      });
    }
  } catch (error) {
    console.error("Error reporting offline changes:", error);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Fetch with a timeout to avoid hanging requests
 * @param request The request to fetch
 * @param timeoutMs Timeout in milliseconds
 * @returns Response or throws error
 */
async function fetchWithTimeout(
  request: RequestInfo,
  timeoutMs: number
): Promise<Response> {
  return Promise.race([
    fetch(request),
    new Promise<Response>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]) as Promise<Response>;
}

/**
 * Load persisted state from cache
 * @returns Promise that resolves when state is loaded
 */
async function loadPersistedState(): Promise<void> {
  try {
    // Load sync queue
    const cache = await caches.open(CACHE_NAMES.DYNAMIC);
    const queueResponse = await cache.match(new Request('/sync-queue'));
    
    if (queueResponse) {
      const loadedQueue = await queueResponse.json();
      syncQueue.push(...loadedQueue);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
}

/**
 * Check if an API endpoint is already cached
 * @param endpoint API endpoint to check
 * @returns True if cached, false otherwise
 */
async function isEndpointCached(endpoint: string): Promise<boolean> {
  for (const cacheName of [CACHE_NAMES.API, CACHE_NAMES.RESULTS, CACHE_NAMES.USER]) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      if (request.url.includes(endpoint)) {
        return true;
      }
    }
  }
  
  return false;
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

// Listen for install events
self.addEventListener('install', (event) => {
  // Cache critical pages and assets
        event.waitUntil(
    caches.open(CACHE_NAMES.DYNAMIC)
      .then((cache) => {
        // Cache important pages
        const pagesToCache = PAGES_TO_CACHE.map(page => 
          fetch(new Request(page, { cache: 'reload' }))
            .then(response => {
              if (response.status === 200) {
                return cache.put(page, response);
              }
            })
            .catch(error => console.error(`Failed to cache page: ${page}`, error))
        );
        
        // Cache critical assets
        const assetsToCahe = CRITICAL_ASSETS.map(asset => 
          fetch(new Request(asset, { cache: 'reload' }))
            .then(response => {
              if (response.status === 200) {
                return cache.put(asset, response);
              }
            })
            .catch(error => console.error(`Failed to cache asset: ${asset}`, error))
        );
        
        return Promise.all([...pagesToCache, ...assetsToCahe]);
      })
  );
});

// Listen for activate events
self.addEventListener('activate', (event) => {
  // Claim clients so the service worker can control pages immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanupCaches(),
      loadPersistedState(),
      prefetchCriticalData(),
      broadcastNetworkStatus()
    ])
  );
});

// Handle fetch events
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || 
      (!request.url.startsWith(self.location.origin) && 
       !url.hostname.includes('tile.openstreetmap.org') && 
       !url.hostname.includes('server.arcgisonline.com'))) {
    return;
  }

  // Handle different types of requests
  
  // Location API
  if (url.pathname === '/api/location' || url.pathname.includes('/lastKnownLocation')) {
    event.respondWith(handleLocationRequest(request));
    return;
  }
  
  // Results API
  if (url.pathname.startsWith('/api/results/') || url.pathname === '/api/results') {
    event.respondWith(handleResultsRequest(request));
    return;
  }
  
  // Seasons API
  if (url.pathname === '/api/seasons') {
    event.respondWith(handleSeasonsRequest(request));
    return;
  }
  
  // User results API
  if (url.pathname === '/api/user/results' || url.pathname.startsWith('/api/user/results/')) {
    event.respondWith(handleUserDataRequest(request));
    return;
  }
  
  // Playground page (special handling for offline)
  if (url.pathname.includes('/playground')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached response if we have one
          return cachedResponse;
        }
        
        return fetch(request).catch(error => {
          // If offline and no cached response, try to return the cached playground page
          return caches.match('/playground').then(cachedPlayground => {
            // Return either the cached playground page or a fallback
            return cachedPlayground || 
              new Response('Offline - Please try again when online', {
                status: 503,
                headers: { 'Content-Type': 'text/html' }
              });
          });
        });
      })
    );
    return;
  }
  
  // Let Serwist handle other requests
});

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-gps-data') {
    event.waitUntil(syncPendingTrackData());
  }
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(processSyncQueue());
  }
});

// Listen for push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        };
    
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received.');
    event.notification.close();
    
    // Check if this is our tracking notification
    if (event.notification.data && event.notification.data.trackingActive) {
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    // If we have an existing window, focus it
                    for (const client of clientList) {
                        if (client.url.includes('/playground') && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Otherwise, open a new window
                    return self.clients.openWindow('/playground');
                })
        );
        return;
    }
    
  // Default notification behavior
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return self.clients.openWindow('/playground');
        })
    );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  // Handle cache cleanup requests
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanupCaches());
  }
  
  // Handle saving data for offline use
  if (event.data && event.data.type === 'SAVE_FOR_OFFLINE') {
    const { url, data } = event.data;
    if (url && data) {
      event.waitUntil(saveDataForOffline(url, data));
    }
  }
  
  // Handle notification management
  if (event.data && event.data.type === 'CREATE_PERSISTENT_NOTIFICATION') {
    event.waitUntil(createPersistentNotification(event.data.data));
  }
  
  if (event.data && event.data.type === 'UPDATE_PERSISTENT_NOTIFICATION') {
    event.waitUntil(updatePersistentNotification(event.data.data));
  }
  
  if (event.data && event.data.type === 'CLOSE_PERSISTENT_NOTIFICATION') {
    event.waitUntil(closePersistentNotification(event.data.data.tag));
  }
  
  // Handle requests for cached endpoints
  if (event.data && event.data.type === 'REQUEST_CACHED_ENDPOINTS') {
    event.waitUntil(notifyClientsAboutCachedResources());
  }
  
  // Handle network status checks
  if (event.data && event.data.type === 'CHECK_NETWORK_STATUS') {
    event.waitUntil(broadcastNetworkStatus());
  }
  
  // Handle pending sync requests
  if (event.data && event.data.type === 'ADD_SYNC_REQUEST') {
    const { url, method, body } = event.data;
    if (url && method) {
      syncQueue.push({
        url,
        method,
        body: body || null,
        timestamp: Date.now()
      });
      
      // Save the updated queue
      event.waitUntil(saveDataForOffline('/sync-queue', syncQueue));
      
      // Try to process immediately if we're online
      if (!networkStatus.isOffline) {
        event.waitUntil(processSyncQueue());
      }
    }
  }
  
  // Network status change
  if (event.data && event.data.type === 'NETWORK_STATUS_CHANGE') {
    const { isOnline } = event.data;
    
    // Update our network status
    networkStatus.isOffline = !isOnline;
    
    // If we're back online, try to sync any pending requests
    if (isOnline) {
      event.waitUntil(Promise.all([
        processSyncQueue(),
        reportOfflineChanges()
      ]));
    }
  }

  // Handle manual caching request
  if (event.data && event.data.type === 'START_CACHING') {
    event.waitUntil(handleManualCaching(event.data.pages, event.data.assets));
  }
});

// =============================================================================
// PERIODIC TASKS
// =============================================================================

// Check network status periodically (every 1 minute)
setInterval(() => {
  broadcastNetworkStatus().catch(error => {
    console.error('Failed to check network status:', error);
  });
}, 60 * 1000);

// Notify clients about cached resources periodically (every 5 minutes)
setInterval(() => {
  notifyClientsAboutCachedResources().catch(error => {
    console.error('Failed to notify about cached resources:', error);
  });
}, 5 * 60 * 1000);

// Clean up caches periodically (once per day)
setInterval(() => {
  cleanupCaches().catch(error => {
    console.error('Failed to clean up caches:', error);
  });
}, 24 * 60 * 60 * 1000);

// Add this after the CACHE_NAMES definition
interface CacheProgress {
  url: string;
  status: 'pending' | 'cached' | 'error';
}

/**
 * Cache a specific URL and update progress
 */
async function cacheUrl(url: string, cacheName: string = CACHE_NAMES.DYNAMIC): Promise<boolean> {
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

/**
 * Handle manual caching request from the client
 */
async function handleManualCaching(pages: string[], assets: string[]): Promise<void> {
  let cached = 0;
  const total = pages.length + assets.length;
  const progress: CacheProgress[] = pages.map(url => ({ url, status: 'pending' }));
  
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
