/**
 * Helper functions for API requests with caching capabilities
 */

type CacheRecord<T> = {
  data: T;
  timestamp: number;
}

// In-memory cache with TTL
const apiCache = new Map<string, CacheRecord<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetch data with caching
 * @param url API endpoint to fetch from
 * @param options Optional fetch options
 * @returns Promise with parsed response data
 */
export async function fetchWithCache<T>(url: string, options?: RequestInit): Promise<T> {
  // For non-GET requests, bypass cache
  if (options && options.method && options.method !== 'GET') {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // Check if data is in cache and not expired
  const cacheKey = `${url}${options ? JSON.stringify(options) : ''}`;
  const cachedData = apiCache.get(cacheKey);
  
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
    return cachedData.data as T;
  }

  // Fetch fresh data
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Store in cache
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data as T;
  } catch (error) {
    throw error;
  }
}

/**
 * Prefetch multiple API endpoints and cache the results
 * @param urls Array of API URLs to prefetch
 */
export async function prefetchApiData(urls: string[]): Promise<void> {
  try {
    await Promise.all(
      urls.map(url => 
        fetchWithCache<unknown>(url)
          .catch(error => console.warn(`Failed to prefetch ${url}:`, error))
      )
    );
  } catch (error) {
    console.warn('Prefetch error:', error);
  }
}

/**
 * Clear all cached API data
 */
export function clearApiCache(): void {
  apiCache.clear();
}

 