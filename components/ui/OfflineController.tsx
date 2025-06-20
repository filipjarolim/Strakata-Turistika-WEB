'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wifi, WifiOff, RefreshCw, Trash2, Download, X, Check, Settings, MapPin, Signal, Battery, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { NetworkStatus } from './NetworkStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  '/images/marker-icon.png',
  '/images/marker-icon-2x.png',
  '/images/marker-shadow.png'
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
  const isServiceWorkerAvailable = typeof navigator !== 'undefined' && 
                                 'serviceWorker' in navigator;

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
    checkCacheStatus();
  }, [checkCacheStatus]);
  
  // Cache GPS resources for offline use
  const cacheGPSResources = async () => {
    if (!isServiceWorkerAvailable) {
      toast.error("Offline mód není dostupný", {
        description: "Váš prohlížeč nepodporuje service worker"
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
      
      // Step 3: Cache additional offline resources
      const additionalResources = [
        '/api/gps/sessions',
        '/api/gps/positions',
        '/api/gps/sync'
      ];
      
      await Promise.all(
        additionalResources.map(async (resource) => {
          try {
            await fetch(resource, { 
              method: 'GET',
              cache: 'force-cache',
              headers: {
                'Service-Worker-Cache': 'true'
              }
            });
          } catch (error) {
            // Ignore API cache errors
          }
        })
      );
      
      setProgress(100);
      
      setTimeout(() => {
        setProgress(0);
        setIsCaching(false);
        checkCacheStatus();
      }, 500);
      
      toast.success("GPS offline cache připraven", {
        description: "GPS sledování je nyní připraveno pro offline použití"
      });
    } catch (error) {
      console.error('Error caching GPS resources:', error);
      setProgress(0);
      setIsCaching(false);
      
      toast.error("Chyba při přípravě offline cache", {
        description: "Nastala chyba při ukládání GPS zdrojů"
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
    if (!isServiceWorkerAvailable) {
      toast.error("Offline mód není dostupný");
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
      
      toast.success("Cache byla vymazána", {
        description: "Všechna offline data byla smazána"
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      setProgress(0);
      setIsClearing(false);
      
      toast.error("Chyba při mazání cache");
    }
  };

  // Refresh cache status
  const refreshCacheStatus = async () => {
    setIsLoading(true);
    await checkCacheStatus();
    setIsLoading(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsOpen(true)}
          className="bg-white shadow-sm"
          aria-label="GPS offline nastavení"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="z-100 w-[400px] sm:w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Offline Nastavení
          </SheetTitle>
          <SheetDescription>
            Správa offline GPS sledování a map
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-full py-4">
          <div className="space-y-6">
            {/* Network Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Signal className="h-5 w-5" />
                  Stav sítě
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Připojení:</span>
                  <NetworkStatus />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-medium">Service Worker:</span>
                  <Badge variant={isServiceWorkerAvailable ? "default" : "destructive"}>
                    {isServiceWorkerAvailable ? "Aktivní" : "Nedostupný"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Cache Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CloudOff className="h-5 w-5" />
                  Stav cache
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshCacheStatus}
                    disabled={isLoading}
                    className="ml-auto h-6 w-6 p-0"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {cacheStatus.gpsReady ? "✓" : "✗"}
                    </div>
                    <div className="text-xs text-blue-700">GPS Ready</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {cacheStatus.mapsReady ? "✓" : "✗"}
                    </div>
                    <div className="text-xs text-green-700">Maps Ready</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div>Celkem uloženo: {cacheStatus.totalCached} zdrojů</div>
                  {cacheStatus.lastUpdated && (
                    <div>Poslední aktualizace: {cacheStatus.lastUpdated.toLocaleTimeString()}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            {(isCaching || isClearing) && (
              <Card>
                <CardContent className="pt-6">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {isCaching ? 'Ukládání GPS zdrojů...' : 'Mazání cache...'}
                    <br />
                    <span className="text-xs">{progress}%</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Akce</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full"
                  disabled={isCaching || isClearing || isOffline}
                  onClick={cacheGPSResources}
                >
                  {isCaching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Připravit GPS offline
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={isCaching || isClearing}
                  onClick={clearAllCache}
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Vymazat cache
                </Button>
              </CardContent>
            </Card>

            {/* Offline Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Offline GPS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                    <div>
                      <div className="font-medium">GPS sledování</div>
                      <div className="text-gray-600">Funguje offline s uloženými mapami</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Battery className="h-4 w-4 mt-0.5 text-green-600" />
                    <div>
                      <div className="font-medium">Úspora baterie</div>
                      <div className="text-gray-600">Optimalizované pro dlouhé sledování</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <WifiOff className="h-4 w-4 mt-0.5 text-amber-600" />
                    <div>
                      <div className="font-medium">Offline data</div>
                      <div className="text-gray-600">Automatická synchronizace při připojení</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" className="w-full">
              Zavřít
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}; 