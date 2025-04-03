'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, Check, Wifi, WifiOff, RefreshCw, LoaderCircle } from 'lucide-react';

interface CacheStatus {
  total: number;
  cached: number;
  inProgress: boolean;
  pages: { url: string; status: 'pending' | 'cached' | 'error' }[];
}

enum ServiceWorkerState {
  PENDING = 'pending',
  REGISTERING = 'registering',
  REGISTERED = 'registered',
  ACTIVE = 'active',
  FAILED = 'failed'
}

const PAGES_TO_CACHE = [
  { url: '/', name: 'Domů' },
  { url: '/playground', name: 'Playground' },
  { url: '/pravidla', name: 'Pravidla' },
  { url: '/vysledky', name: 'Výsledky' },
  { url: '/offline', name: 'Offline stránka' },
  { url: '/login', name: 'Přihlášení' },
  { url: '/profile', name: 'Profil' },
  { url: '/prihlaseni', name: 'Registrace' }
];

const CRITICAL_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/dog_emoji.png',
  '/manifest.json',
  '/favicon.ico',
  '/icons/transparent-header.png'
];

export function CacheManager() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [serviceWorkerState, setServiceWorkerState] = useState<ServiceWorkerState>(ServiceWorkerState.PENDING);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    total: PAGES_TO_CACHE.length + CRITICAL_ASSETS.length,
    cached: 0,
    inProgress: false,
    pages: PAGES_TO_CACHE.map(page => ({ url: page.url, status: 'pending' as const }))
  });

  // Check service worker status on mount
  useEffect(() => {
    const checkServiceWorker = async () => {
      try {
        if (!('serviceWorker' in navigator)) {
          setServiceWorkerState(ServiceWorkerState.FAILED);
          return;
        }

        setServiceWorkerState(ServiceWorkerState.REGISTERING);
        
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          // Service worker is registered
          if (navigator.serviceWorker.controller) {
            setServiceWorkerState(ServiceWorkerState.ACTIVE);
          } else {
            setServiceWorkerState(ServiceWorkerState.REGISTERED);
          }
        } else {
          // Try to register service worker
          await navigator.serviceWorker.register('/sw.js');
          setServiceWorkerState(ServiceWorkerState.REGISTERED);
        }
      } catch (error) {
        console.error('Service worker registration failed:', error);
        setServiceWorkerState(ServiceWorkerState.FAILED);
      }
    };

    checkServiceWorker();
  }, []);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    // Listen for service worker controlling the page
    const handleControllerChange = () => {
      if (navigator.serviceWorker.controller) {
        setServiceWorkerState(ServiceWorkerState.ACTIVE);
      }
    };

    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    // Listen for cache progress updates from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CACHE_PROGRESS') {
        setCacheStatus(prev => ({
          ...prev,
          cached: event.data.cached,
          pages: event.data.pages
        }));
      } else if (event.data.type === 'CACHE_COMPLETE') {
        setCacheStatus(prev => ({
          ...prev,
          inProgress: false
        }));
        toast({
          title: "Offline cache complete",
          description: "All pages and assets have been cached for offline use.",
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [toast]);

  const startCaching = async () => {
    if (serviceWorkerState !== ServiceWorkerState.ACTIVE) {
      toast({
        title: "Service Worker not ready",
        description: "Please reload the page to activate the service worker.",
        variant: "destructive"
      });
      return;
    }

    setCacheStatus(prev => ({ ...prev, inProgress: true }));
    
    // Request the service worker to start caching
    navigator.serviceWorker.controller?.postMessage({
      type: 'START_CACHING',
      pages: PAGES_TO_CACHE.map(p => p.url),
      assets: CRITICAL_ASSETS
    });
  };

  const activateServiceWorker = () => {
    // Add a cache-busting query parameter to ensure the page reloads fresh
    window.location.href = window.location.href.split('?')[0] + '?sw=' + Date.now();
  };

  const progress = (cacheStatus.cached / cacheStatus.total) * 100;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Offline Mode Manager</h2>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-yellow-500" />
          )}
          <span className={isOnline ? "text-green-500" : "text-yellow-500"}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Service Worker Status</span>
          <span className={
            serviceWorkerState === ServiceWorkerState.ACTIVE ? "text-green-500" : 
            serviceWorkerState === ServiceWorkerState.FAILED ? "text-red-500" : 
            "text-yellow-500"
          }>
            {serviceWorkerState === ServiceWorkerState.PENDING && "Checking..."}
            {serviceWorkerState === ServiceWorkerState.REGISTERING && "Registering..."}
            {serviceWorkerState === ServiceWorkerState.REGISTERED && "Registered (Needs Activation)"}
            {serviceWorkerState === ServiceWorkerState.ACTIVE && "Active"}
            {serviceWorkerState === ServiceWorkerState.FAILED && "Failed"}
          </span>
        </div>
        
        {serviceWorkerState === ServiceWorkerState.REGISTERED && (
          <Button 
            onClick={activateServiceWorker} 
            variant="outline" 
            className="w-full mb-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload to Activate Service Worker
          </Button>
        )}

        <div className="flex justify-between text-sm">
          <span>Cache Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-2">
        {PAGES_TO_CACHE.map(page => (
          <div key={page.url} className="flex items-center justify-between text-sm">
            <span>{page.name}</span>
            {cacheStatus.pages.find(p => p.url === page.url)?.status === 'cached' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <span className="text-muted-foreground">Pending</span>
            )}
          </div>
        ))}
      </div>

      <Button
        onClick={startCaching}
        disabled={cacheStatus.inProgress || !isOnline || serviceWorkerState !== ServiceWorkerState.ACTIVE}
        className="w-full"
      >
        {cacheStatus.inProgress ? (
          <>
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            Caching...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Cache for Offline Use
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        Cache pages and assets for offline use. The Playground will be fully functional offline,
        including GPS tracking. Data will sync when you&apos;re back online.
      </p>
    </div>
  );
} 