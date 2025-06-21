'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { IOSButton } from "@/components/ui/ios/button";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSStatsCard } from "@/components/ui/ios/stats-card";
import { Loader2, Wifi, WifiOff, RefreshCw, Trash2, Download, X, Check, Settings, MapPin, Signal, Battery, CloudOff, Globe, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { NetworkStatus } from './NetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

// List of critical pages that should always be cached for offline use
const DEFAULT_CRITICAL_PAGES = [
  '/',
  '/vysledky',
  '/pravidla',
  '/offline',
  '/fotogalerie',
  '/kontakty'
];

// GPS-specific cache requirements
const GPS_CRITICAL_RESOURCES = [
  '/soutez/gps',
  '/offline',
  '/offline-map',
  '/manifest.json',
  '/sw.js',
  '/images/marker-icon.svg',
  '/images/marker-icon-2x.svg',
  '/images/marker-shadow.svg'
];

// Map tiles and external resources
const MAP_RESOURCES = [
  'https://api.maptiler.com/maps/outdoor-v2/256/',
  'https://tile.openstreetmap.org/',
  'https://server.arcgisonline.com/'
];

export const OfflineController: React.FC = () => {
  const isOffline = useOfflineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>(DEFAULT_CRITICAL_PAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<{
    gpsReady: boolean;
    mapsReady: boolean;
    totalCached: number;
    lastUpdated: Date | null;
  }>({
    gpsReady: false,
    mapsReady: false,
    totalCached: 0,
    lastUpdated: null
  });
  
  // Check if service worker is available
  const isServiceWorkerAvailable = isClient && typeof navigator !== 'undefined' && 
                                 'serviceWorker' in navigator;
  
  // State to track service worker registration status
  const [swRegistrationStatus, setSwRegistrationStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // Set client flag on mount to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Move checkCacheStatus above useEffect
  const checkCacheStatus = useCallback(async () => {
    if (!isServiceWorkerAvailable) return;
    try {
      const caches = await window.caches.keys();
      const gpsCache = caches.find(cache => cache.includes('gps'));
      const staticCache = caches.find(cache => cache.includes('static'));
      let totalCached = 0;
      if (gpsCache) {
        const cache = await window.caches.open(gpsCache);
        const keys = await cache.keys();
        totalCached += keys.length;
      }
      if (staticCache) {
        const cache = await window.caches.open(staticCache);
        const keys = await cache.keys();
        totalCached += keys.length;
      }
      setCacheStatus({
        gpsReady: !!gpsCache,
        mapsReady: totalCached > 10, // Assume maps are ready if we have significant cache
        totalCached,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error checking cache status:', error);
    }
  }, [isServiceWorkerAvailable]);

  // Check cache status on mount
  useEffect(() => {
    if (isClient) {
      checkCacheStatus();
    }
  }, [checkCacheStatus, isClient]);
  
  // Check service worker registration status
  useEffect(() => {
    if (!isClient) return;
    
    const checkServiceWorkerStatus = async () => {
      if (!isServiceWorkerAvailable) {
        setSwRegistrationStatus('unavailable');
        return;
      }
      
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          setSwRegistrationStatus('available');
        } else {
          setSwRegistrationStatus('unavailable');
        }
      } catch (error) {
        console.error('Error checking service worker status:', error);
        setSwRegistrationStatus('unavailable');
      }
    };
    
    checkServiceWorkerStatus();
  }, [isServiceWorkerAvailable, isClient]);
  
  // Cache GPS resources for offline use
  const cacheGPSResources = async () => {
    if (swRegistrationStatus !== 'available') {
      toast.error("Offline mod neni dostupny", {
        description: "Service worker neni aktivni nebo neni podporovan"
      });
      return;
    }
    
    setIsCaching(true);
    setProgress(0);
    
    try {
      // Step 1: Cache critical GPS resources (20%)
      setProgress(10);
      await Promise.all(
        GPS_CRITICAL_RESOURCES.map(async (resource) => {
          try {
            const response = await fetch(resource, { 
              method: 'GET',
              cache: 'force-cache',
              headers: {
                'Service-Worker-Cache': 'true'
              }
            });
            return response.ok;
          } catch (error) {
            console.error(`Failed to cache ${resource}:`, error);
            return false;
          }
        })
      );
      
      setProgress(30);
      
      // Step 2: Pre-load map tiles for common zoom levels (60%)
      const zoomLevels = [10, 11, 12, 13, 14, 15];
      const centerLat = 50.0755; // Prague center
      const centerLng = 14.4378;
      
      for (const zoom of zoomLevels) {
        const tiles = getTilesForArea(centerLat, centerLng, zoom, 0.1); // ~10km radius
        for (const tile of tiles) {
          try {
            await fetch(tile, { 
              method: 'GET',
              cache: 'force-cache',
              headers: {
                'Service-Worker-Cache': 'true'
              }
            });
          } catch (error) {
            // Ignore tile fetch errors
          }
        }
        setProgress(30 + (zoom - 10) * 5);
      }
      
      setProgress(90);
      
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsCaching(false);
        checkCacheStatus();
      }, 500);
      
      toast.success("GPS offline cache pripraven", {
        description: "GPS sledovani je nyni pripraveno pro offline pouziti"
      });
    } catch (error) {
      console.error('Error caching GPS resources:', error);
      setProgress(0);
      setIsCaching(false);
      
      toast.error("Chyba pri priprave offline cache", {
        description: "Nastala chyba pri ukladani GPS zdroju"
      });
    }
  };
  
  // Helper function to get map tiles for an area
  const getTilesForArea = (lat: number, lng: number, zoom: number, radiusDegrees: number) => {
    const tiles: string[] = [];
    const latMin = lat - radiusDegrees;
    const latMax = lat + radiusDegrees;
    const lngMin = lng - radiusDegrees;
    const lngMax = lng + radiusDegrees;
    
    // Convert to tile coordinates
    const n = Math.pow(2, zoom);
    const xtileMin = Math.floor((lngMin + 180) / 360 * n);
    const xtileMax = Math.floor((lngMax + 180) / 360 * n);
    const ytileMin = Math.floor((1 - Math.log(Math.tan(latMin * Math.PI / 180) + 1 / Math.cos(latMin * Math.PI / 180)) / Math.PI) / 2 * n);
    const ytileMax = Math.floor((1 - Math.log(Math.tan(latMax * Math.PI / 180) + 1 / Math.cos(latMax * Math.PI / 180)) / Math.PI) / 2 * n);
    
    for (let x = xtileMin; x <= xtileMax; x++) {
      for (let y = ytileMin; y <= ytileMax; y++) {
        tiles.push(`https://api.maptiler.com/maps/outdoor-v2/256/${zoom}/${x}/${y}.png?key=a5w3EO45npvzNFzD6VoD`);
      }
    }
    
    return tiles;
  };
  
  // Clear the cache
  const clearAllCache = async () => {
    if (swRegistrationStatus !== 'available') {
      toast.error("Offline mod neni dostupny");
      return;
    }
    
    setIsClearing(true);
    setProgress(10);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 200);
      
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => window.caches.delete(cacheName))
        );
      }
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsClearing(false);
        checkCacheStatus();
      }, 500);
      
      toast.success("Cache byla vymazana", {
        description: "Vsechna offline data byla smazana"
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      setProgress(0);
      setIsClearing(false);
      
      toast.error("Chyba pri mazani cache");
    }
  };

  // Refresh cache status
  const refreshCacheStatus = async () => {
    setIsLoading(true);
    await checkCacheStatus();
    setIsLoading(false);
  };

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Fixed position button - like bug report */}
      <div className="fixed bottom-4 right-4 z-50">
        <IOSButton 
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90 transition-all duration-200"
          aria-label="GPS offline nastaveni"
        >
          <Settings className="h-4 w-4" />
        </IOSButton>
      </div>

      {/* Modal overlay - like bug report */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 z-[101] flex items-center justify-center"
            >
              <div className="w-full max-w-md max-h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 p-6 border-b border-gray-200/50">
                  <IOSCircleIcon variant="blue" size="md">
                    <MapPin className="h-6 w-6" />
                  </IOSCircleIcon>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">GPS Offline</h2>
                    <p className="text-sm text-gray-500">Sprava offline GPS sledovani</p>
                  </div>
                  <IOSButton
                    variant="outline"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </IOSButton>
                </div>
                
                {/* Content */}
                <ScrollArea className="h-[60vh] p-6">
                  <div className="space-y-6">
                    {/* Network Status */}
                    <IOSCard
                      title="Stav site"
                      icon={<Signal className="h-5 w-5" />}
                      iconBackground="bg-blue-100"
                      iconColor="text-blue-600"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Pripojeni:</span>
                          <NetworkStatus />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Service Worker:</span>
                          <IOSBadge 
                            label={swRegistrationStatus === 'checking' ? "Kontroluji..." :
                                   swRegistrationStatus === 'available' ? "Aktivni" : "Nedostupny"}
                            bgColor={swRegistrationStatus === 'available' ? 'bg-green-100' : 'bg-red-100'}
                            textColor={swRegistrationStatus === 'available' ? 'text-green-800' : 'text-red-800'}
                            borderColor={swRegistrationStatus === 'available' ? 'border-green-200' : 'border-red-200'}
                            size="sm"
                          />
                        </div>
                      </div>
                    </IOSCard>

                    {/* Cache Stats */}
                    <IOSSection title="Stav cache">
                      <div className="grid grid-cols-2 gap-4">
                        <IOSStatsCard
                          title="GPS Ready"
                          value={cacheStatus.gpsReady ? "✓" : "✗"}
                          variant={cacheStatus.gpsReady ? "success" : "warning"}
                          icon={<Smartphone className="h-4 w-4" />}
                        />
                        <IOSStatsCard
                          title="Maps Ready"
                          value={cacheStatus.mapsReady ? "✓" : "✗"}
                          variant={cacheStatus.mapsReady ? "success" : "warning"}
                          icon={<Globe className="h-4 w-4" />}
                        />
                      </div>
                      <div className="mt-4 text-sm text-gray-600">
                        <div className="flex justify-between items-center">
                          <span>Celkem ulozeno:</span>
                          <span className="font-medium">{cacheStatus.totalCached} zdroju</span>
                        </div>
                        {cacheStatus.lastUpdated && (
                          <div className="flex justify-between items-center mt-1">
                            <span>Posledni aktualizace:</span>
                            <span className="font-medium">{cacheStatus.lastUpdated.toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </IOSSection>

                    {/* Progress Indicator */}
                    {(isCaching || isClearing) && (
                      <IOSCard>
                        <div className="space-y-4">
                          <Progress value={progress} className="h-3" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">
                              {isCaching ? 'Ukladani GPS zdroju...' : 'Mazani cache...'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                          </div>
                        </div>
                      </IOSCard>
                    )}

                    {/* Actions */}
                    <IOSSection title="Akce">
                      <div className="space-y-3">
                        <IOSButton 
                          className="w-full h-12"
                          disabled={isCaching || isClearing || isOffline || swRegistrationStatus !== 'available'}
                          onClick={cacheGPSResources}
                          loading={isCaching}
                          icon={!isCaching ? <Download className="h-4 w-4" /> : undefined}
                        >
                          {isCaching ? 'Ukladani...' : 'Pripravit GPS offline'}
                        </IOSButton>
                        
                        <IOSButton 
                          variant="outline"
                          className="w-full h-12"
                          disabled={isCaching || isClearing}
                          onClick={clearAllCache}
                          loading={isClearing}
                          icon={!isClearing ? <Trash2 className="h-4 w-4" /> : undefined}
                        >
                          {isClearing ? 'Mazani...' : 'Vymazat cache'}
                        </IOSButton>
                      </div>
                    </IOSSection>

                    {/* Offline Info */}
                    <IOSCard
                      title="Offline GPS"
                      icon={<WifiOff className="h-5 w-5" />}
                      iconBackground="bg-amber-100"
                      iconColor="text-amber-600"
                    >
                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                          <IOSCircleIcon variant="blue" size="sm">
                            <MapPin className="h-4 w-4" />
                          </IOSCircleIcon>
                          <div>
                            <div className="font-medium text-gray-900">GPS sledovani</div>
                            <div className="text-gray-600">Funguje offline s ulozenymi mapami</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <IOSCircleIcon variant="amber" size="sm">
                            <Battery className="h-4 w-4" />
                          </IOSCircleIcon>
                          <div>
                            <div className="font-medium text-gray-900">Uspora baterie</div>
                            <div className="text-gray-600">Optimalizovane pro dlouhe sledovani</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <IOSCircleIcon variant="blue" size="sm">
                            <CloudOff className="h-4 w-4" />
                          </IOSCircleIcon>
                          <div>
                            <div className="font-medium text-gray-900">Offline data</div>
                            <div className="text-gray-600">Automaticka synchronizace pri pripojeni</div>
                          </div>
                        </div>
                      </div>
                    </IOSCard>
                  </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="p-6 border-t border-gray-200/50">
                  <IOSButton 
                    className="w-full h-12"
                    onClick={() => setIsOpen(false)}
                  >
                    Zavrit
                  </IOSButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}; 