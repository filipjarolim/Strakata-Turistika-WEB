'use client';

import { useEffect, useState } from 'react';
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline, isOfflineCapable } = useOfflineStatus();
  const [visible, setVisible] = useState(false);
  
  // Only show the indicator briefly when status changes or if offline
  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
    } else {
      // When going online, show briefly then hide
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline]);
  
  // Don't show anything if offline capability is not available
  if (!isOfflineCapable) {
    return null;
  }
  
  if (!visible) {
    return null;
  }
  
  return (
    <Badge 
      variant={isOnline ? "outline" : "destructive"}
      className="animate-fade-in-out transition-all"
    >
      {isOnline ? (
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
  );
} 