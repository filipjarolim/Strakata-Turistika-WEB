'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * Component that displays an offline indicator when the user loses their internet connection
 * Works with the service worker to provide real-time connection status updates
 */
export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const pathname = usePathname();

  useEffect(() => {
    // Initial check of offline status
    setIsOffline(!navigator.onLine);
    
    // Listen for online/offline events from the browser
    const handleOnline = () => {
      setIsOffline(false);
      setIsVisible(false);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setIsVisible(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for messages from the service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CONNECTION_STATUS') {
          const newOfflineState = !!event.data.isOffline;
          
          if (newOfflineState !== isOffline) {
            setIsOffline(newOfflineState);
            
            // Only show the indicator if we just went offline
            if (newOfflineState) {
              setIsVisible(true);
            } else {
              // When coming back online, show for 3 seconds then hide
              setIsVisible(true);
              setTimeout(() => setIsVisible(false), 3000);
            }
          }
        }
      });
      
      // Ask the service worker to check online status
      navigator.serviceWorker.controller.postMessage({
        type: 'CHECK_ONLINE_STATUS'
      });
    }
    
    // Set up periodic online checks
    const intervalId = setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_ONLINE_STATUS'
        });
      }
    }, 60000); // Every minute
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOffline]);
  
  // Don't render on the offline page
  if (pathname === '/offline') return null;
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 py-2 px-4 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 ${
        isOffline 
          ? 'bg-red-500 text-white' 
          : 'bg-green-500 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Jste offline</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4" />
          <span className="text-sm font-medium">Připojení obnoveno</span>
        </>
      )}
    </div>
  );
} 