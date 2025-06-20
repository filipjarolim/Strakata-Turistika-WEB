'use client';

import React, { useState, useEffect } from 'react';
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

export const GPSLoadingScreen: React.FC<GPSLoadingScreenProps> = ({ onReady, isOnline }) => {
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

  // Check if service worker is available
  const isServiceWorkerAvailable = typeof navigator !== 'undefined' && 
                                 'serviceWorker' in navigator;

  // GPS critical resources
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

  // Check initial cache status
  useEffect(() => {
    checkInitialCacheStatus();
  }, []);

  // Skip timer
  useEffect(() => {
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

  const checkInitialCacheStatus = async () => {
    setCacheStatus(prev => ({ ...prev, currentStep: 'Kontrola cache...', progress: 10 }));
    
    if (!isServiceWorkerAvailable) {
      setCacheStatus(prev => ({ 
        ...prev, 
        currentStep: 'Service Worker nedostupný',
        progress: 100 
      }));
      setIsLoading(false);
      return;
    }

    try {
      // Check existing cache
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

      setCacheStatus(prev => ({ 
        ...prev, 
        gpsReady,
        mapsReady,
        totalCached,
        progress: gpsReady && mapsReady ? 100 : 30,
        currentStep: gpsReady && mapsReady ? 'GPS připraveno!' : 'Načítání GPS zdrojů...'
      }));

      if (gpsReady && mapsReady) {
        // GPS is ready, show success briefly then proceed
        setTimeout(() => {
          setIsLoading(false);
          onReady();
        }, 1500);
      } else {
        // Need to load GPS resources
        await loadGPSResources();
      }
    } catch (error) {
      console.error('Error checking cache status:', error);
      setCacheStatus(prev => ({ 
        ...prev, 
        currentStep: 'Chyba při kontrole cache',
        progress: 100 
      }));
      setIsLoading(false);
    }
  };

  const loadGPSResources = async () => {
    setCacheStatus(prev => ({ ...prev, currentStep: 'Načítání GPS stránek...', progress: 40 }));
    
    try {
      // Cache critical GPS resources
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
      
      // Pre-load some map tiles for common zoom levels
      const zoomLevels = [13, 14, 15];
      const centerLat = 50.0755; // Prague center
      const centerLng = 14.4378;
      
      for (const zoom of zoomLevels) {
        const tiles = getTilesForArea(centerLat, centerLng, zoom, 0.05); // ~5km radius
        for (const tile of tiles.slice(0, 20)) { // Limit to 20 tiles per zoom level
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
        setCacheStatus(prev => ({ 
          ...prev, 
          progress: 60 + (zoom - 13) * 10,
          currentStep: `Mapy zoom ${zoom}...`
        }));
      }
      
      setCacheStatus(prev => ({ 
        ...prev, 
        currentStep: 'Dokončování...', 
        progress: 90 
      }));
      
      // Final cache check
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

      // Show success briefly then proceed
      setTimeout(() => {
        setIsLoading(false);
        onReady();
      }, 1500);
      
    } catch (error) {
      console.error('Error loading GPS resources:', error);
      setCacheStatus(prev => ({ 
        ...prev, 
        currentStep: 'Chyba při načítání',
        progress: 100 
      }));
      setIsLoading(false);
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

  const handleSkip = () => {
    setIsLoading(false);
    onReady();
  };

  const isGPSReady = cacheStatus.gpsReady && cacheStatus.mapsReady;

  return (
    <div className="h-screen max-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">GPS Tracker</h1>
              <p className="text-gray-600">Příprava offline sledování</p>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {isOnline ? <Wifi className="h-6 w-6 mx-auto" /> : <WifiOff className="h-6 w-6 mx-auto" />}
                </div>
                <div className="text-xs text-blue-700 font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="text-center p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {isGPSReady ? <CheckCircle className="h-6 w-6 mx-auto" /> : <AlertCircle className="h-6 w-6 mx-auto" />}
                </div>
                <div className="text-xs text-green-700 font-medium">
                  {isGPSReady ? 'Připraveno' : 'Načítání'}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Průběh</span>
                <span className="text-sm text-gray-500">{cacheStatus.progress}%</span>
              </div>
              <Progress value={cacheStatus.progress} className="h-3" />
              <p className="text-sm text-gray-600 mt-2 text-center">
                {cacheStatus.currentStep}
              </p>
            </div>

            {/* Cache Info */}
            {cacheStatus.totalCached > 0 && (
              <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudOff className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Cache</span>
                  </div>
                  <Badge variant="outline">
                    {cacheStatus.totalCached} zdrojů
                  </Badge>
                </div>
              </div>
            )}

            {/* Service Worker Status */}
            <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Service Worker</span>
                </div>
                <Badge variant={isServiceWorkerAvailable ? "default" : "destructive"}>
                  {isServiceWorkerAvailable ? "Aktivní" : "Nedostupný"}
                </Badge>
              </div>
            </div>

            {/* Skip Button */}
            {canSkip && !isGPSReady && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSkip}
              >
                <Play className="h-4 w-4 mr-2" />
                Pokračovat bez cache ({skipTimer}s)
              </Button>
            )}

            {/* Loading Animation */}
            {!canSkip && !isGPSReady && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Příprava GPS sledování...</p>
              </div>
            )}

            {/* Success State */}
            {isGPSReady && (
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600 font-medium">GPS připraveno!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 