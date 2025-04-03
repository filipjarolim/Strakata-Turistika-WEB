'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { isOnline } from '@/lib/serviceWorker';

/**
 * A component for testing offline functionality
 */
export function OfflineTest() {
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('Checking...');
  const [cacheStatus, setCacheStatus] = useState<string>('Unknown');

  useEffect(() => {
    // Check online status
    setStatus(isOnline() ? 'online' : 'offline');

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          setServiceWorkerStatus(
            `Registered (${registration.active ? 'active' : registration.installing ? 'installing' : 'waiting'})`
          );
        } else {
          setServiceWorkerStatus('Not registered');
        }
      });
    } else {
      setServiceWorkerStatus('Not supported');
    }

    // Event listeners for online/offline events
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if a page is in the cache
  const checkCache = async () => {
    try {
      if ('caches' in window) {
        const cache = await caches.open('offlineCache');
        if (cache) {
          const cachedResponse = await cache.match('/');
          if (cachedResponse) {
            setCacheStatus('Homepage is cached');
            toast.success('Homepage is cached for offline use');
          } else {
            setCacheStatus('Homepage is not cached');
            toast.error('Homepage is not cached yet');
          }
        }
      } else {
        setCacheStatus('Cache API not supported');
        toast.error('Cache API is not supported in this browser');
      }
    } catch (error) {
      console.error('Error checking cache:', error);
      setCacheStatus('Error checking cache');
      toast.error('Error checking cache status');
    }
  };

  // Force cache the homepage
  const cacheHomepage = async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_PAGE',
          url: '/'
        });
        
        toast.info('Requested caching of homepage...');
        setCacheStatus('Caching requested');
        
        // Check cache after a delay
        setTimeout(checkCache, 2000);
      } else {
        toast.error('Service worker not active');
      }
    } catch (error) {
      console.error('Error caching homepage:', error);
      toast.error('Failed to cache homepage');
    }
  };

  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardHeader>
        <CardTitle>Offline Functionality Test</CardTitle>
        <CardDescription>Test your offline capabilities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Network Status:</span>
            <span className={status === 'online' ? 'text-green-500' : 'text-red-500'}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Service Worker:</span>
            <span>{serviceWorkerStatus}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Cache Status:</span>
            <span>{cacheStatus}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkCache}>
          Check Cache
        </Button>
        <Button onClick={cacheHomepage}>
          Cache Homepage
        </Button>
      </CardFooter>
    </Card>
  );
} 