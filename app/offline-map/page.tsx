'use client';

import React from 'react';
import { MapPin, WifiOff, RefreshCw } from 'lucide-react';

const OfflineMapPage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          <MapPin className="w-10 h-10 text-gray-600" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Map Unavailable
          </h1>
          <p className="text-gray-600">
            Map tiles cannot be loaded while offline. Please check your internet connection and try again.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-4">
            <WifiOff className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-gray-900">Offline Mode</span>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            GPS tracking will continue to work offline, but map display requires an internet connection.
          </p>
          
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineMapPage; 