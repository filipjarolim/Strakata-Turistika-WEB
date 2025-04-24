'use client';

import { useEffect, useState, useCallback } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function NetworkStatus() {
  const isOffline = useOfflineStatus();
  const [latency, setLatency] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  // Check connection latency - using useCallback to avoid dependency issues
  const checkLatency = useCallback(async () => {
    if (isOffline) return;
    
    setChecking(true);
    const start = Date.now();
    
    try {
      // Use a small endpoint that returns quickly
      await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'pragma': 'no-cache' }
      });
      
      const end = Date.now();
      setLatency(end - start);
    } catch (error) {
      console.error('Latency check failed:', error);
      setLatency(null);
    } finally {
      setChecking(false);
    }
  }, [isOffline]);

  // Check latency periodically when online
  useEffect(() => {
    if (isOffline) {
      setLatency(null);
      return;
    }
    
    checkLatency();
    
    const intervalId = setInterval(checkLatency, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [isOffline, checkLatency]);

  // Quality indicator based on latency
  const getConnectionQuality = () => {
    if (isOffline) return 'offline';
    if (latency === null) return 'unknown';
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    if (latency < 600) return 'fair';
    return 'poor';
  };
  
  const quality = getConnectionQuality();
  
  // Color based on quality
  const getColorClass = () => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'offline': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        className={`${getColorClass()} transition-colors duration-300`}
        variant="outline"
      >
        {isOffline ? (
          <WifiOff className="h-3 w-3 mr-1" />
        ) : (
          <Wifi className="h-3 w-3 mr-1" />
        )}
        
        {quality === 'unknown' ? 'Checking...' : quality}
        
        {!isOffline && latency !== null && (
          <span className="ml-1 text-xs opacity-75">{latency}ms</span>
        )}
        
        {checking && <Loader2 className="ml-1 h-3 w-3 animate-spin" />}
      </Badge>
    </div>
  );
} 