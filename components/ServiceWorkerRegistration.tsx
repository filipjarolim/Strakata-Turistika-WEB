'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UpdateStatus = 'none' | 'available' | 'installing' | 'ready';

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  updateStatus: UpdateStatus;
  offlineReady: boolean;
}

/**
 * A component that handles service worker registration and updates
 * This component has no UI - it runs in the background
 */
export function ServiceWorkerRegistration() {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    registration: null,
    updateStatus: 'none',
    offlineReady: false
  });
  const router = useRouter();

  useEffect(() => {
    // Only run in the browser, and only if service workers are supported
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Function to register the service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('Service worker registered:', registration.scope);
        
        setSwState(prev => ({
          ...prev,
          registration,
          offlineReady: true
        }));

        // Check for updates on initial load
        checkForUpdates(registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (!newWorker) return;
          
          setSwState(prev => ({
            ...prev,
            updateStatus: 'installing'
          }));
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setSwState(prev => ({
                ...prev,
                updateStatus: 'available'
              }));
            }
          });
        });
        
        // After successful registration, prefetch and cache critical pages
        if (registration.active && navigator.onLine) {
          prefetchCriticalPages();
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    // Check for service worker updates
    const checkForUpdates = async (registration: ServiceWorkerRegistration) => {
      try {
        await registration.update();
      } catch (error) {
        console.error('Error checking for service worker updates:', error);
      }
    };
    
    // Prefetch critical pages for offline use
    const prefetchCriticalPages = () => {
      const pagesToCache = [
        '/',
        '/vysledky',
        '/pravidla',
        '/offline',
        '/prihlaseni'
      ];
      
      const controller = navigator.serviceWorker.controller;
      if (controller) {
        pagesToCache.forEach(url => {
          controller.postMessage({
            type: 'CACHE_PAGE',
            url
          });
        });
      }
    };

    // Handle service worker lifecycle events
    const handleControllerChange = () => {
      // The service worker has changed, let the service worker handle the reload
      if (swState.updateStatus === 'available') {
        setSwState(prev => ({
          ...prev,
          updateStatus: 'ready'
        }));
      }
    };

    // Handle messages from the service worker
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      
      const { type } = event.data;
      
      // Handle connection status changes
      if (type === 'CONNECTION_STATUS' && event.data.isOffline) {
        // If we're offline, check if we're not on an offline-capable page
        const currentPath = window.location.pathname;
        const validOfflinePaths = ['/', '/offline', '/pravidla', '/vysledky'];
        
        if (!validOfflinePaths.some(path => currentPath.startsWith(path))) {
          // Redirect to offline page
          router.push('/offline');
        }
      }
      
      // Handle cache events
      if (type === 'PAGE_CACHED') {
        console.log(`Page cached for offline use: ${event.data.url}`);
      }
    };

    // Set up event listeners
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    // Register service worker
    registerServiceWorker();
    
    // Set up periodic update checks every 4 hours
    const intervalId = setInterval(() => {
      if (swState.registration) {
        checkForUpdates(swState.registration);
      }
    }, 4 * 60 * 60 * 1000);

    // Clean up event listeners when component unmounts
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      clearInterval(intervalId);
    };
  }, [router, swState.updateStatus]);

  // This component doesn't render anything
  return null;
} 