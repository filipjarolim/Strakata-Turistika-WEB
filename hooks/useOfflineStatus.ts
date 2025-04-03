'use client';

import { useState, useEffect } from 'react';

export interface OfflineStatus {
  /**
   * Whether the application is currently offline
   */
  isOffline: boolean;
  
  /**
   * Whether the application has a service worker registered
   */
  hasServiceWorker: boolean;
  
  /**
   * Last time the connection status was checked
   */
  lastChecked: number | null;
  
  /**
   * Connection quality information
   */
  connection: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
}

/**
 * Hook that provides information about the application's offline status
 * Works with the service worker to provide real-time connection information
 */
export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>({
    isOffline: false,
    hasServiceWorker: false,
    lastChecked: null,
    connection: {}
  });

  useEffect(() => {
    // Check if we're running in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    // Set initial offline status based on browser's navigator.onLine
    setStatus(prev => ({
      ...prev,
      isOffline: !navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator && !!navigator.serviceWorker.controller,
      lastChecked: Date.now(),
      connection: getConnectionInfo()
    }));

    // Listen for online/offline events from browser
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOffline: false,
        lastChecked: Date.now()
      }));
      
      // Notify service worker we're back online
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NETWORK_STATUS_CHANGE',
          isOnline: true
        });
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOffline: true,
        lastChecked: Date.now()
      }));
      
      // Notify service worker we're offline
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'NETWORK_STATUS_CHANGE',
          isOnline: false
        });
      }
    };
    
    // Function to get connection information from the Network Information API
    function getConnectionInfo() {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        return {
          effectiveType: conn?.effectiveType,
          downlink: conn?.downlink,
          rtt: conn?.rtt,
          saveData: conn?.saveData
        };
      }
      return {};
    }
    
    // Listen for connection quality changes
    const handleConnectionChange = () => {
      setStatus(prev => ({
        ...prev,
        connection: getConnectionInfo(),
        lastChecked: Date.now()
      }));
    };

    // Listen for messages from service worker about connection status
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CONNECTION_STATUS') {
        setStatus(prev => ({
          ...prev,
          isOffline: !!event.data.isOffline,
          lastChecked: Date.now()
        }));
      }
    };

    // Manual check for connectivity
    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/ping', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        clearTimeout(timeoutId);
        
        setStatus(prev => ({
          ...prev,
          isOffline: !response.ok,
          lastChecked: Date.now(),
          connection: getConnectionInfo()
        }));
        
        return response.ok;
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          isOffline: true,
          lastChecked: Date.now()
        }));
        
        return false;
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }
    
    // Perform an initial connectivity check
    checkConnectivity();
    
    // Set up periodic connectivity check (every minute)
    const intervalId = setInterval(checkConnectivity, 60000);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(intervalId);
    };
  }, []);

  return status;
} 