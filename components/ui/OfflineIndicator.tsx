'use client';

import { useEffect, useState } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { cn } from "@/lib/utils";
import { shouldEnableOffline } from '@/lib/dev-utils';

// Use dynamic imports to prevent HMR issues
const Wifi = () => <div className="w-3 h-3 bg-green-500 rounded-full" />;
const WifiOff = () => <div className="w-3 h-3 bg-red-500 rounded-full" />;
const MapPin = () => <div className="w-3 h-3 bg-blue-500 rounded-full" />;
const CloudOff = () => <div className="w-2 h-2 bg-blue-500 rounded-full" />;
const CheckCircle = () => <div className="w-3 h-3 bg-green-500 rounded-full" />;
const AlertCircle = () => <div className="w-3 h-3 bg-amber-500 rounded-full" />;
const Signal = () => <div className="w-3 h-3 bg-blue-500 rounded-full" />;

interface CacheStatus {
  gpsReady: boolean;
  mapsReady: boolean;
  totalCached: number;
}

export function OfflineIndicator() {
  const isOffline = useOfflineStatus();
  const [visible, setVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    gpsReady: false,
    mapsReady: false,
    totalCached: 0
  });
  
  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Check cache status
  const checkCacheStatus = async () => {
    // Disable cache checking in development unless offline is enabled
    if (!shouldEnableOffline()) {
      return;
    }
    
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
    if (!isClient) return;
    
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
  }, [isOffline, isClient]);

  // Check cache status periodically
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(checkCacheStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isClient]);
  
  // Don't render until client-side hydration is complete
  if (!isClient || !visible) {
    return null;
  }
  
  // Don't render in development mode unless offline is enabled
  if (!shouldEnableOffline()) {
    return null;
  }
  
  const isGPSReady = cacheStatus.gpsReady && cacheStatus.mapsReady;
  
  return (
    <div className="flex items-center gap-3">
      {/* Network Status */}
      <IOSBadge 
        label={!isOffline ? "Online" : "Offline"}
        bgColor={!isOffline ? "bg-green-100" : "bg-red-100"}
        textColor={!isOffline ? "text-green-800" : "text-red-800"}
        borderColor={!isOffline ? "border-green-200" : "border-red-200"}
        size="sm"
        icon={!isOffline ? <Wifi /> : <WifiOff />}
        className="animate-fade-in-out transition-all"
      />

      {/* GPS Cache Status */}
      <IOSBadge 
        label={isGPSReady ? "GPS Ready" : "GPS Loading"}
        bgColor={isGPSReady ? "bg-green-100" : "bg-amber-100"}
        textColor={isGPSReady ? "text-green-800" : "text-amber-800"}
        borderColor={isGPSReady ? "border-green-200" : "border-amber-200"}
        size="sm"
        icon={isGPSReady ? <CheckCircle /> : <AlertCircle />}
        className={cn(
          "animate-fade-in-out transition-all"
        )}
      />

      {/* Cache Info */}
      {cacheStatus.totalCached > 0 && (
        <IOSBadge 
          label={`${cacheStatus.totalCached}`}
          bgColor="bg-blue-100"
          textColor="text-blue-800"
          borderColor="border-blue-200"
          size="sm"
          icon={<CloudOff />}
        />
      )}
    </div>
  );
} 