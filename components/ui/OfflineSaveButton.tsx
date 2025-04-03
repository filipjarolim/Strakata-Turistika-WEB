'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { isUrlCached } from '@/lib/offline-utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

interface OfflineSaveButtonProps {
  /**
   * Optional specific URL to save (default: current URL)
   */
  url?: string;
  
  /**
   * Optional label for the button
   */
  label?: string;
  
  /**
   * Optional CSS class names
   */
  className?: string;
  
  /**
   * Whether to only show the icon (no label)
   */
  iconOnly?: boolean;
}

/**
 * Button component that allows users to save pages for offline use
 */
export default function OfflineSaveButton({
  url,
  label = 'Uložit offline',
  className = '',
  iconOnly = false
}: OfflineSaveButtonProps) {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const pathname = usePathname();
  const { hasServiceWorker } = useOfflineStatus();
  
  // The URL to save (current page if not specified)
  const targetUrl = url || pathname;
  
  useEffect(() => {
    // Check if service workers are supported
    setIsSupported('serviceWorker' in navigator && hasServiceWorker);
    
    // Check if the page is already cached
    const checkCacheStatus = async () => {
      const cached = await isUrlCached(targetUrl);
      setIsSaved(cached);
    };
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      checkCacheStatus();
      
      // Set up listener for cache status updates
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PAGE_CACHED' && event.data.url === targetUrl) {
          setIsSaved(true);
          setIsSaving(false);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [targetUrl, hasServiceWorker]);
  
  const handleSave = () => {
    if (!isSupported || isSaving) {
      return;
    }
    
    setIsSaving(true);
    
    if (navigator.serviceWorker.controller) {
      // Request the service worker to cache the page
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PAGE',
        url: targetUrl
      });
      
      // Set a timeout to prevent the button being stuck in saving state
      setTimeout(() => {
        setIsSaving(false);
        
        // Double-check the cache status
        isUrlCached(targetUrl).then(cached => {
          setIsSaved(cached);
        });
      }, 3000);
    } else {
      setIsSaving(false);
    }
  };
  
  if (!isSupported) {
    return null;
  }
  
  return (
    <button
      onClick={handleSave}
      disabled={isSaving || isSaved}
      className={`inline-flex items-center justify-center transition-colors ${
        isSaved
          ? 'text-green-600 cursor-default'
          : 'text-blue-600 hover:text-blue-700'
      } ${className}`}
      title={isSaved ? 'Stránka je již uložená pro offline použití' : 'Uložit pro offline použití'}
      aria-label={isSaved ? 'Stránka je již uložená pro offline použití' : 'Uložit pro offline použití'}
    >
      {isSaved ? (
        <BookmarkSolidIcon className="h-5 w-5" />
      ) : (
        <BookmarkIcon className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
      )}
      
      {!iconOnly && (
        <span className="ml-2">
          {isSaving ? 'Ukládám...' : isSaved ? 'Uloženo' : label}
        </span>
      )}
    </button>
  );
} 