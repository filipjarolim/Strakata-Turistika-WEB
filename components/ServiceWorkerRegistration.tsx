'use client';

import { useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';

export default function ServiceWorkerRegistration() {
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('[ServiceWorker] Registration successful with scope:', registration.scope);
          
          // Handle service worker update detection
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker is available but waiting to activate
                    console.log('[ServiceWorker] New version available! Showing update notification.');
                    setShowUpdateToast(true);
                  } else {
                    // First time service worker installation completed
                    console.log('[ServiceWorker] Content is now available offline!');
                    setOfflineReady(true);
                  }
                }
              });
            }
          });
          
          // Listen for messages from the service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            const data = event.data;
            
            if (data && data.type === 'CACHE_COMPLETE') {
              console.log('[ServiceWorker] Cache completion received:', data);
            }
            
            if (data && data.type === 'CACHE_CLEARED') {
              console.log('[ServiceWorker] Cache cleared notification received:', data);
            }
          });
          
          // Cache important pages on load
          if (registration.active) {
            registration.active.postMessage({
              type: 'CACHE_ALL_PAGES'
            });
          }
          
        } catch (error) {
          console.error('[ServiceWorker] Registration failed:', error);
        }
      };
      
      // Register after the page loads to avoid impacting page performance
      if (document.readyState === 'complete') {
        registerServiceWorker();
      } else {
        window.addEventListener('load', registerServiceWorker);
        return () => {
          window.removeEventListener('load', registerServiceWorker);
        };
      }
    }
  }, []);
  
  // Function to reload the page when user clicks on the update notification
  const applyUpdate = () => {
    window.location.reload();
    setShowUpdateToast(false);
  };
  
  return (
    <>
      {showUpdateToast && (
        <Toast
          open={showUpdateToast}
          onOpenChange={setShowUpdateToast}
          title="Update available"
          description="A new version is available. Click to update."
          action={{
            label: "Update",
            onClick: applyUpdate
          }}
          duration={0} // Don't auto-dismiss
        />
      )}
      
      {offlineReady && (
        <Toast
          open={offlineReady}
          onOpenChange={setOfflineReady}
          title="Offline Ready"
          description="This app can now work offline!"
          duration={3000}
        />
      )}
    </>
  );
} 