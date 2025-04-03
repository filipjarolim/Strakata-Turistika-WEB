'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon, WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

export default function OfflinePage() {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [cachedPages, setCachedPages] = useState<string[]>([]);
  
  useEffect(() => {
    // Attempt to retrieve available cached pages
    const checkCachedPages = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Create a message channel to communicate with the service worker
        const messageChannel = new MessageChannel();
        
        // Set up the message handler
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.type === 'CACHED_PAGES') {
            setCachedPages(event.data.pages || []);
          }
        };
        
        // Ask the service worker for cached pages
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHED_PAGES' },
          [messageChannel.port2]
        );
      }
    };
    
    checkCachedPages();
    
    // Set up connection change detection
    const handleConnectionChange = () => {
      if (navigator.onLine) {
        window.location.href = '/';
      }
    };
    
    window.addEventListener('online', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
    };
  }, []);
  
  const checkConnection = () => {
    setIsCheckingConnection(true);
    
    // Try to fetch a small resource to verify connection
    fetch('/api/ping', { method: 'HEAD' })
      .then(() => {
        // If successful, we're online
        window.location.href = '/';
      })
      .catch(() => {
        // Still offline
        setIsCheckingConnection(false);
      });
  };
  
  // Common available pages in the app
  const commonPages = [
    { name: 'Domů', path: '/' },
    { name: 'Pravidla', path: '/pravidla' },
    { name: 'Moje výsledky', path: '/vysledky/moje' },
    { name: 'Výsledky', path: '/vysledky' }
  ];
  
  // Filter the common pages to only show ones that are cached
  const availablePages = commonPages.filter(
    page => cachedPages.includes(page.path)
  );
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="mb-4 flex justify-center">
          <div className="relative h-24 w-24 mb-2">
            <Image
              src="/icons/dog_emoji.png"
              alt="Strakatá turistika logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
        
        <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold mb-2">Jste offline</h1>
        
        <p className="text-gray-600 mb-6">
          Vypadá to, že vaše připojení k internetu nefunguje. Některé funkce aplikace
          jsou dostupné i offline.
        </p>
        
        <button 
          onClick={checkConnection}
          disabled={isCheckingConnection}
          className="flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mb-6"
        >
          {isCheckingConnection ? (
            <>
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Kontroluji připojení...
            </>
          ) : (
            <>
              <WifiIcon className="h-5 w-5 mr-2" />
              Zkusit znovu
            </>
          )}
        </button>
        
        {availablePages.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3">Dostupné stránky</h2>
            <ul className="space-y-2 mb-6">
              {availablePages.map((page) => (
                <li key={page.path}>
                  <Link
                    href={page.path}
                    className="block py-2 px-3 bg-gray-100 rounded text-blue-600 hover:bg-gray-200"
                  >
                    {page.name}
                  </Link>
                </li>
              ))}
              </ul>
          </>
        )}
        
        <div className="text-sm text-gray-500">
          <p>Vaše offline data a uložené záznamy budou automaticky synchronizovány, až budete zpět online.</p>
        </div>
      </div>
    </div>
  );
}
