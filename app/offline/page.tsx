import React from 'react';
import { Wifi, MapPin, RefreshCw, Clock, MapIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Strakatatour</h1>
          <div className="flex items-center text-red-500 gap-1.5">
            <Wifi className="h-5 w-5" />
            <span className="text-sm font-medium">Offline</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 bg-gray-800 text-white">
            <div className="flex items-center justify-center text-center mb-4">
              <div className="bg-red-100 text-red-500 p-3 rounded-full">
                <Wifi className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center">You're Offline</h2>
            <p className="text-gray-300 text-center mt-2">
              No internet connection available
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Don't worry! You can still access some features while offline:
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">GPS Tracking</span>
                    <p className="text-sm text-gray-500">
                      You can still track your routes offline. Data will sync when you're back online.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <MapIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Cached Maps</span>
                    <p className="text-sm text-gray-500">
                      Previously viewed map areas are available offline.
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900">Saved Data</span>
                    <p className="text-sm text-gray-500">
                      You can access your previously loaded tracks and routes.
                    </p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-6 space-y-3">
                <Link href="/playground" className="w-full">
                  <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                    <MapPin className="mr-2 h-4 w-4" />
                    Go to GPS Tracker
                  </Button>
                </Link>
                
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try to reconnect
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Your data is stored locally and will sync when you're back online.</p>
        </div>
      </main>
    </div>
  );
}
