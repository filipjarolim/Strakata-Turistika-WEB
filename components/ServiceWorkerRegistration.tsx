'use client';

import { useEffect, useState } from 'react';

interface OfflineStatus {
  isRegistered: boolean;
  cachedEndpoints: string[];
  lastUpdated: number | null;
}

export function ServiceWorkerRegistration() {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isRegistered: false,
    cachedEndpoints: [],
    lastUpdated: null
  });

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
            setOfflineStatus(prev => ({ ...prev, isRegistered: true }));
            
            // Request cached endpoints information
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'REQUEST_CACHED_ENDPOINTS'
              });
            }
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_CACHED_API_ENDPOINTS') {
          setOfflineStatus(prev => ({
            ...prev,
            cachedEndpoints: event.data.endpoints || [],
            lastUpdated: event.data.timestamp
          }));
        }
      });
      
      // Check for network connectivity changes
      window.addEventListener('online', () => {
        if (navigator.serviceWorker.controller) {
          // When coming back online, request fresh data
          navigator.serviceWorker.controller.postMessage({
            type: 'NETWORK_STATUS_CHANGE',
            isOnline: true
          });
        }
      });
      
      window.addEventListener('offline', () => {
        if (navigator.serviceWorker.controller) {
          // When going offline, notify service worker
          navigator.serviceWorker.controller.postMessage({
            type: 'NETWORK_STATUS_CHANGE',
            isOnline: false
          });
        }
      });
    }
  }, []);
  
  // No visible UI by default
  return null;
} 