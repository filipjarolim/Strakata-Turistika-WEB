/**
 * Utilities for managing offline data and caching
 */

/**
 * Cache data in localStorage with timestamp
 * @param key Cache key
 * @param data Data to cache
 * @param ttl Time to live in milliseconds (default: 1 hour)
 */
export function cacheData<T>(key: string, data: T, ttl: number = 60 * 60 * 1000): void {
  try {
    const item = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };
    
    localStorage.setItem(`cache:${key}`, JSON.stringify(item));
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
}

/**
 * Get cached data from localStorage
 * @param key Cache key
 * @param ignoreExpiry Whether to ignore expiry and return stale data
 * @returns Cached data or null if not found or expired
 */
export function getCachedData<T>(key: string, ignoreExpiry: boolean = false): T | null {
  try {
    const cached = localStorage.getItem(`cache:${key}`);
    
    if (!cached) {
      return null;
    }
    
    const item = JSON.parse(cached);
    
    // Check if the cache has expired
    if (!ignoreExpiry && item.expiry < Date.now()) {
      return null;
    }
    
    return item.data as T;
  } catch (error) {
    console.error('Failed to retrieve cached data:', error);
    return null;
  }
}

/**
 * Invalidate cached data
 * @param key Cache key or pattern (e.g. 'api/results/*')
 */
export function invalidateCache(key: string): void {
  try {
    // Check if it's a pattern with a wildcard
    if (key.includes('*')) {
      const pattern = key.replace(/\*/g, '');
      
      // Find all keys that match the pattern
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('cache:') && k.includes(pattern)) {
          localStorage.removeItem(k);
        }
      }
    } else {
      // Remove the specific key
      localStorage.removeItem(`cache:${key}`);
    }
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
  }
}

/**
 * Fetch data with offline support
 * @param url URL to fetch
 * @param options Fetch options
 * @param cacheKey Custom cache key (defaults to URL)
 * @param ttl Time to live in milliseconds
 * @returns Response data or cached data if offline
 */
export async function fetchWithOfflineSupport<T>(
  url: string,
  options?: RequestInit,
  cacheKey?: string,
  ttl?: number
): Promise<T> {
  const key = cacheKey || url;
  
  try {
    // Try to fetch from network
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the successful response
    cacheData<T>(key, data, ttl);
    
    return data;
  } catch (error) {
    console.warn(`Fetch failed, trying cached data for ${url}:`, error);
    
    // If network request fails, try to get cached data
    const cachedData = getCachedData<T>(key, true);
    
    if (cachedData) {
      return cachedData;
    }
    
    // If no cached data is available, re-throw the error
    throw new Error(`Failed to fetch data and no cached data available: ${error}`);
  }
}

/**
 * Prefetch and cache multiple URLs
 * @param urls URLs to prefetch
 * @param options Fetch options
 * @param ttl Cache TTL in milliseconds
 */
export async function prefetchUrls(
  urls: string[],
  options?: RequestInit,
  ttl?: number
): Promise<void> {
  if (!navigator.onLine) {
    console.warn('Cannot prefetch URLs while offline');
    return;
  }
  
  try {
    // Request the service worker to prefetch these URLs
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PREFETCH_URLS',
        urls
      });
    }
    
    // Also cache in localStorage for additional resilience
    await Promise.allSettled(
      urls.map(url => 
        fetch(url, options)
          .then(response => response.json())
          .then(data => cacheData(url, data, ttl))
          .catch(error => console.warn(`Failed to prefetch ${url}:`, error))
      )
    );
  } catch (error) {
    console.error('Error prefetching URLs:', error);
  }
}

/**
 * Check if the URL is cached by the service worker
 * @param url URL to check
 * @returns Promise resolving to true if cached, false otherwise
 */
export async function isUrlCached(url: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return false;
    }
    
    // Create a message channel to get a response from the service worker
    const messageChannel = new MessageChannel();
    
    return new Promise(resolve => {
      // Set up the message handler
      messageChannel.port1.onmessage = (event) => {
        if (event.data && typeof event.data.isCached === 'boolean') {
          resolve(event.data.isCached);
        } else {
          resolve(false);
        }
      };
      
      // Ask the service worker if the URL is cached
      navigator.serviceWorker.controller.postMessage(
        { type: 'IS_URL_CACHED', url },
        [messageChannel.port2]
      );
      
      // Set a timeout in case the service worker doesn't respond
      setTimeout(() => resolve(false), 1000);
    });
  } catch (error) {
    console.error('Error checking if URL is cached:', error);
    return false;
  }
} 