'use client';

import { useEffect, useState } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const isOffline = useOfflineStatus();
  const [visible, setVisible] = useState(false);
  
  // Only show the indicator briefly when status changes or if offline
  useEffect(() => {
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
  
  if (!visible) {
    return null;
  }
  
  return (
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
  );
} 