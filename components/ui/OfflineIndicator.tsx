'use client';

import { useEffect, useState } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, MapPin, CloudOff, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CacheStatus {
  gpsReady: boolean;
  mapsReady: boolean;
  totalCached: number;
}

export function OfflineIndicator() {
  const isOffline = useOfflineStatus();
  const [visible, setVisible] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    gpsReady: false,
    mapsReady: false,
    totalCached: 0
  });
  
  // Check cache status
  const checkCacheStatus = async () => {
    if (typeof window === 'undefined' || !('caches' in window)) return;

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
        mapsReady: totalCached > 10,
        totalCached
      });
    } catch (error) {
      console.error('Error checking cache status:', error);
    }
  };
  
  // Show the indicator when status changes or if offline
  useEffect(() => {
    checkCacheStatus();
    
    if (isOffline) {
      setVisible(true);
    } else {
      // When going online, show briefly then hide
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  // Check cache status periodically
  useEffect(() => {
    const interval = setInterval(checkCacheStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  if (!visible) {
    return null;
  }
  
  const isGPSReady = cacheStatus.gpsReady && cacheStatus.mapsReady;
  
  return (
    <div className="flex items-center gap-2">
      {/* Network Status */}
      <Badge 
        variant={!isOffline ? "outline" : "destructive"}
        className="animate-fade-in-out transition-all"
      >
        {!isOffline ? (
          <>
            <Wifi className="h-3 w-3 mr-1" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </>
        )}
      </Badge>

      {/* GPS Cache Status */}
      <Badge 
        variant={isGPSReady ? "default" : "secondary"}
        className={cn(
          "animate-fade-in-out transition-all",
          isGPSReady ? "bg-green-100 text-green-800 border-green-200" : "bg-amber-100 text-amber-800 border-amber-200"
        )}
      >
        {isGPSReady ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            GPS Ready
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 mr-1" />
            GPS Loading
          </>
        )}
      </Badge>

      {/* Cache Info */}
      {cacheStatus.totalCached > 0 && (
        <Badge 
          variant="outline"
          className="text-xs"
        >
          <CloudOff className="h-2 w-2 mr-1" />
          {cacheStatus.totalCached}
        </Badge>
      )}
    </div>
  );
} 