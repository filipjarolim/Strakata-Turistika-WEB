'use client';

import { useState, useEffect } from 'react';
import { useOfflineStatus } from '@/lib/hooks/useOfflineStatus';

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

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`p-3 rounded-lg shadow-md transition-all duration-300 ${
          isOnline 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        }`}
      >
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <span className="font-medium">
            {isOnline ? 'Online' : 'Offline režim'}
          </span>
          <svg 
            className={`ml-2 w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
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
              {getAvailableFeatures().length > 0 ? (
                <ul className="list-disc pl-5">
                  {getAvailableFeatures().map((feature, index) => (
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
    </div>
  );
} 