'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status and cached content
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isOfflineCapable, setIsOfflineCapable] = useState<boolean>(false);
  const [cachedEndpoints, setCachedEndpoints] = useState<string[]>([]);
  
  useEffect(() => {
    // Check if the browser supports ServiceWorker and if we're online
    const checkCapability = () => {
      setIsOfflineCapable('serviceWorker' in navigator);
      setIsOnline(navigator.onLine);
    };
    
    checkCapability();
    
    // Set up event listeners for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Listen for service worker messages about cached endpoints
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_CACHED_API_ENDPOINTS') {
        setCachedEndpoints(event.data.endpoints || []);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      // Request cached endpoints from service worker
      navigator.serviceWorker.controller.postMessage({
        type: 'REQUEST_CACHED_ENDPOINTS'
      });
    }
    
    // Clean up listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);
  
  return {
    isOnline,
    isOfflineCapable,
    cachedEndpoints
  };
} 