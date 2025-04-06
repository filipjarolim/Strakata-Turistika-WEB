'use client';

import { useState, useEffect } from 'react';
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus';
import { Wifi, WifiOff, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function OfflineIndicator() {
  const { isOnline, isOfflineCapable, cachedEndpoints, isEndpointCached } = useOfflineStatus();
  const [expanded, setExpanded] = useState(false);

  // Show expanded view automatically when offline
  useEffect(() => {
    if (!isOnline) {
      setExpanded(true);
    }
  }, [isOnline]);

  if (!isOfflineCapable) {
    return null; // Don't show anything if offline capabilities aren't available
  }

  // Generate user-friendly feature list based on cached endpoints
  const getAvailableFeatures = (): string[] => {
    const features = [];
    
    if (isEndpointCached('/api/seasons')) {
      features.push('Sezóny');
    }
    
    if (isEndpointCached('/api/results')) {
      features.push('Všechny výsledky');
    }
    
    if (cachedEndpoints.some(url => url.includes('/api/results/'))) {
      features.push('Výsledky podle roku');
    }
    
    if (cachedEndpoints.some(url => url.includes('/api/user/results'))) {
      features.push('Vaše výsledky');
    }
    
    return features;
  };

  const features = getAvailableFeatures();
  const featureCount = features.length;

  return (
    <div 
      className={`rounded-full shadow-md transition-all duration-300 flex items-center ${
        isOnline 
          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      } ${expanded ? 'p-3 rounded-lg' : 'p-2.5'}`}
    >
      <div 
        className="flex items-center cursor-pointer gap-2"
        onClick={() => setExpanded(!expanded)}
        aria-label={`${isOnline ? 'Online' : 'Offline'} status. Click to expand`}
        role="button"
        tabIndex={0}
      >
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span className={`font-medium ${expanded ? 'inline' : 'hidden md:inline'}`}>
          {isOnline ? 'Online' : 'Offline režim'}
        </span>
        
        {!expanded && featureCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                >
                  {featureCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>{featureCount} {featureCount === 1 ? 'funkce dostupná' : 'funkce dostupné'} offline</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {expanded && (
        <div className="mt-2 text-sm">
          {!isOnline && (
            <p className="mb-2">
              Pracujete v offline režimu. Některé funkce mohou být omezené.
            </p>
          )}
          
          <div className="mt-1">
            <p className="font-medium mb-1">Dostupné offline:</p>
            {features.length > 0 ? (
              <ul className="list-disc pl-5">
                {features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            ) : (
              <p>Žádný obsah není momentálně uložen pro offline použití.</p>
            )}
          </div>
          
          {isOnline && (
            <p className="mt-2 text-xs">
              Pro offline použití si prohlédněte stránky při připojení k internetu.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 