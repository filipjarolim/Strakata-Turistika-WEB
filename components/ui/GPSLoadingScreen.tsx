'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Wifi, 
  WifiOff, 
  CloudOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Download,
  Signal,
  Battery,
  Settings,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GPSLoadingScreenProps {
  onReady: () => void;
  isOnline: boolean;
}

interface CacheStatus {
  gpsReady: boolean;
  mapsReady: boolean;
  totalCached: number;
  progress: number;
  currentStep: string;
}

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

const getTilesForArea = (lat: number, lng: number, zoom: number, radiusDegrees: number) => {
  const tiles: string[] = [];
  const latMin = lat - radiusDegrees;
  const latMax = lat + radiusDegrees;
  const lngMin = lng - radiusDegrees;
  const lngMax = lng + radiusDegrees;
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

export const GPSLoadingScreen: React.FC<GPSLoadingScreenProps> = ({ onReady, isOnline }) => {
  // Initialize all state to static values to prevent hydration issues
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    gpsReady: false,
    mapsReady: false,
    totalCached: 0,
    progress: 0,
    currentStep: 'Kontrola cache...'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const [skipTimer, setSkipTimer] = useState(5);
  const [isServiceWorkerAvailable, setIsServiceWorkerAvailable] = useState(false);

  // Check if service worker is available (client only)
  useEffect(() => {
    setIsServiceWorkerAvailable(typeof navigator !== 'undefined' && 'serviceWorker' in navigator);
  }, []);

  // Skip timer (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (skipTimer > 0 && !cacheStatus.gpsReady) {
      const timer = setTimeout(() => {
        setSkipTimer(skipTimer - 1);
        if (skipTimer === 1) {
          setCanSkip(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [skipTimer, cacheStatus.gpsReady]);

  const loadGPSResources = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setCacheStatus(prev => ({ ...prev, currentStep: 'Načítání GPS stránek...', progress: 40 }));
    try {
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
      setCacheStatus(prev => ({ ...prev, currentStep: 'Načítání map...', progress: 60 }));
      const zoomLevels = [13, 14, 15];
      const centerLat = 50.0755;
      const centerLng = 14.4378;
      for (const zoom of zoomLevels) {
        const tiles = getTilesForArea(centerLat, centerLng, zoom, 0.05);
        for (const tile of tiles.slice(0, 20)) {
          try {
            await fetch(tile, { 
              method: 'GET',
              cache: 'force-cache',
              headers: {
                'Service-Worker-Cache': 'true'
              }
            });
          } catch (error) {}
        }
        setCacheStatus(prev => ({ 
          ...prev, 
          progress: 60 + (zoom - 13) * 10,
          currentStep: `Mapy zoom ${zoom}...`
        }));
      }
      setCacheStatus(prev => ({ ...prev, currentStep: 'Dokončování...', progress: 90 }));
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
      setCacheStatus(prev => ({ 
        ...prev, 
        gpsReady: true,
        mapsReady: totalCached > 10,
        totalCached,
        currentStep: 'GPS připraveno!',
        progress: 100 
      }));
      setTimeout(() => {
        setIsLoading(false);
        onReady();
      }, 1500);
    } catch (error) {
      console.error('Error loading GPS resources:', error);
      setCacheStatus(prev => ({ ...prev, currentStep: 'Chyba při načítání', progress: 100 }));
      setIsLoading(false);
    }
  }, [onReady]);

  const checkInitialCacheStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setCacheStatus(prev => ({ ...prev, currentStep: 'Kontrola cache...', progress: 10 }));
    if (!isServiceWorkerAvailable) {
      setCacheStatus(prev => ({ ...prev, currentStep: 'Service Worker nedostupný', progress: 100 }));
      setIsLoading(false);
      return;
    }
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
      const gpsReady = !!gpsCache;
      const mapsReady = totalCached > 10;
      setCacheStatus(prev => ({ ...prev, gpsReady, mapsReady, totalCached, progress: gpsReady && mapsReady ? 100 : 30, currentStep: gpsReady && mapsReady ? 'GPS připraveno!' : 'Načítání GPS zdrojů...' }));
      if (gpsReady && mapsReady) {
        setTimeout(() => {
          setIsLoading(false);
          onReady();
        }, 1500);
      } else {
        loadGPSResources();
      }
    } catch (error) {
      console.error('Error checking cache status:', error);
      setCacheStatus(prev => ({ ...prev, currentStep: 'Chyba při kontrole cache', progress: 100 }));
      setIsLoading(false);
    }
  }, [isServiceWorkerAvailable, loadGPSResources, onReady]);

  // Initialize cache check (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    checkInitialCacheStatus();
  }, [checkInitialCacheStatus]);

  const handleSkip = () => {
    if (typeof window === 'undefined') return;
    setIsLoading(false);
    onReady();
  };

  const handleRetry = () => {
    if (typeof window === 'undefined') return;
    setCacheStatus(prev => ({ ...prev, progress: 0, currentStep: 'Kontrola cache...' }));
    setIsLoading(true);
    setCanSkip(false);
    setSkipTimer(5);
    checkInitialCacheStatus();
  };

  // Simple loading screen for development or when cache is disabled
  if (typeof window === 'undefined' || !isServiceWorkerAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="p-4 rounded-full bg-blue-100 w-fit mx-auto">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">GPS Tracker</h2>
              <p className="text-sm text-gray-600">Loading GPS functionality...</p>
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <Button onClick={onReady} className="w-full">
              Continue to GPS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="p-4 rounded-full bg-blue-100 w-fit mx-auto">
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">GPS Tracker</h2>
              <p className="text-sm text-gray-600">Připravujeme offline funkcionalitu</p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{cacheStatus.progress}%</span>
            </div>
            <Progress value={cacheStatus.progress} className="h-2" />
            <p className="text-xs text-gray-500 text-center">{cacheStatus.currentStep}</p>
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg border",
              cacheStatus.gpsReady 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-gray-50 border-gray-200 text-gray-500"
            )}>
              {cacheStatus.gpsReady ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span className="text-xs font-medium">GPS Ready</span>
            </div>
            <div className={cn(
              "flex items-center gap-2 p-3 rounded-lg border",
              cacheStatus.mapsReady 
                ? "bg-green-50 border-green-200 text-green-700" 
                : "bg-gray-50 border-gray-200 text-gray-500"
            )}>
              {cacheStatus.mapsReady ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <span className="text-xs font-medium">Maps Ready</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"}>
              {cacheStatus.totalCached} cached
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {canSkip && (
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                Skip
              </Button>
            )}
            <Button onClick={handleRetry} className="flex-1">
              Retry
            </Button>
          </div>

          {/* Skip Timer */}
          {!canSkip && skipTimer > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Skip available in {skipTimer} seconds
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 