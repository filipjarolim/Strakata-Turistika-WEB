// In-memory cache for API responses
const apiCache = new Map<string, { 
  data: unknown, 
  timestamp: number 
}>();

// Cache expiration time (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetches data from an API with in-memory caching
 * @param url The API endpoint URL
 * @param options Fetch options
 * @param ttl Custom time-to-live in milliseconds (defaults to 5 minutes)
 */
export async function fetchWithCache<T>(
  url: string, 
  options?: RequestInit, 
  ttl: number = CACHE_TTL
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options || {})}`;
  const now = Date.now();
  
  // Check if we have a valid cached response
  const cachedResponse = apiCache.get(cacheKey);
  if (cachedResponse && now - cachedResponse.timestamp < ttl) {
    return cachedResponse.data as T;
  }
  
  // Fetch fresh data
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the response
    apiCache.set(cacheKey, { 
      data, 
      timestamp: now 
    });
    
    return data as T;
  } catch (error) {
    // If we have stale cached data, return it rather than failing
    if (cachedResponse) {
      console.warn('Failed to fetch fresh data, using stale cache');
      return cachedResponse.data as T;
    }
    throw error;
  }
}

/**
 * Prefetches and caches API data in the background
 * @param urls Array of URLs to prefetch
 */
export function prefetchApiData(urls: string[]): void {
  urls.forEach(url => {
    fetchWithCache(url).catch(err => {
      console.warn(`Failed to prefetch ${url}:`, err);
    });
  });
}

/**
 * Invalidates specific cache entries
 * @param urlPatterns Array of URL patterns to invalidate (strings or RegExp)
 */
export function invalidateCache(urlPatterns: (string | RegExp)[]): void {
  for (const [key] of apiCache.entries()) {
    if (urlPatterns.some(pattern => {
      if (typeof pattern === 'string') {
        return key.includes(pattern);
      }
      return pattern.test(key);
    })) {
      apiCache.delete(key);
    }
  }
}

/**
 * Clears the entire cache
 */
export function clearCache(): void {
  apiCache.clear();
} 