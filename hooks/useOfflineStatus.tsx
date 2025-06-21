"use client";

import { useEffect, useState } from 'react';

/**
 * Hook to track the network connection status
 * @returns {boolean} - Returns true if the browser is offline
 */
export function useOfflineStatus(): boolean {
  // Start with false (online) to match server-side rendering
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side after hydration
    setIsClient(true);
    
    // Set initial state based on navigator.onLine
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Return false during SSR and initial client render to prevent hydration mismatch
  return isClient ? isOffline : false;
} 