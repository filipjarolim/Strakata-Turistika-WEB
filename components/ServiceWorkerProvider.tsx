'use client';

import { useEffect, useState } from 'react';
import { registerServiceWorker, handleOfflineMode } from '@/lib/serviceWorker';
import { toast } from 'sonner';

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Monitor online/offline status
    const cleanup = handleOfflineMode((online) => {
      setIsOffline(!online);
      
      if (!online) {
        toast.warning('You are offline. Some features may be limited.', {
          duration: 4000,
          id: 'offline-notification',
        });
      } else {
        toast.success('You are back online!', {
          duration: 3000,
          id: 'online-notification',
        });
      }
    });

    return cleanup;
  }, []);

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-2 text-center text-sm z-50">
          You are currently offline. Some features may be limited.
        </div>
      )}
      {children}
    </>
  );
}

export default ServiceWorkerProvider; 