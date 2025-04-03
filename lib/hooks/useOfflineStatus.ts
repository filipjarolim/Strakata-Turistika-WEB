'use client';

import { useState, useEffect } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  isOfflineCapable: boolean; 
  cachedEndpoints: string[];
  lastUpdated: number | null;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOfflineCapable: false,
    cachedEndpoints: [],
    lastUpdated: null
  });

  useEffect(() => {
    // Check if service worker is supported and active
    const checkServiceWorker = () => {
      const isSupported = 'serviceWorker' in navigator;
      const isActive = !!navigator.serviceWorker.controller;
      return isSupported && isActive;
    };

    // Update status based on network changes
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Handle messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'UPDATE_CACHED_API_ENDPOINTS') {
        setStatus(prev => ({
          ...prev,
          isOfflineCapable: true,
          cachedEndpoints: event.data.endpoints || [],
          lastUpdated: event.data.timestamp
        }));
      }
      
      if (event.data && event.data.type === 'NETWORK_STATUS_UPDATE') {
        setStatus(prev => ({
          ...prev,
          isOnline: !event.data.isOffline,
        }));
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (checkServiceWorker()) {
      setStatus(prev => ({ ...prev, isOfflineCapable: true }));
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      // Request current cached endpoints
      navigator.serviceWorker.controller?.postMessage({
        type: 'REQUEST_CACHED_ENDPOINTS'
      });
    }

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkServiceWorker()) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  // Helper to check if specific endpoint is cached
  const isEndpointCached = (endpoint: string): boolean => {
    return status.cachedEndpoints.some(url => url.includes(endpoint));
  };

  return {
    ...status,
    isEndpointCached
  };
} 