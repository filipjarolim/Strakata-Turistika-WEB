'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, MapPin, Activity, Clock, RefreshCw, Home, Navigation } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getStoredTrackingSession, EnhancedTrackingSession } from '@/components/pwa/gps-tracker/backgroundTracking';

const OfflinePage = () => {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [lastSession, setLastSession] = useState<EnhancedTrackingSession | null>(null);

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Get last tracking session
    try {
      const session = getStoredTrackingSession();
      if (session && session.positions && session.positions.length > 0) {
        setLastSession(session);
      }
    } catch (error) {
      console.error('Error getting last session:', error);
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoGPS = () => {
    router.push('/soutez/gps');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isOnline ? 'Connection Restored' : 'You\'re Offline'}
            </h1>
            <p className="text-gray-600">
              {isOnline 
                ? 'Your connection has been restored. You can now use all features.'
                : 'No internet connection detected. Some features may be limited.'
              }
            </p>
          </div>
        </div>

        {/* Status Card */}
        <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Internet Connection</span>
              <div className={`flex items-center gap-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">GPS Tracking</span>
              <div className="text-blue-600">
                <span className="text-sm font-medium">Available</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Offline Storage</span>
              <div className="text-green-600">
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Session Info */}
        {lastSession && (
          <Card className="bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5" />
                Last Tracking Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Distance</span>
                <span className="font-medium">{lastSession.totalDistance.toFixed(2)} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">
                  {Math.floor(lastSession.totalTime / 60000)} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Points</span>
                <span className="font-medium">{lastSession.positions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`text-sm font-medium ${
                  lastSession.isActive ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {lastSession.isActive ? 'Active' : 'Completed'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isOnline ? (
            <Button 
              onClick={handleRetry} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh Page
            </Button>
          ) : (
            <Button 
              onClick={handleGoGPS} 
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Continue GPS Tracking
            </Button>
          )}
          
          <Button 
            onClick={handleGoHome} 
            variant="outline"
            className="w-full h-12 bg-white/60 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 text-gray-700 font-medium rounded-xl"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Button>
        </div>

        {/* Offline Features Info */}
        <Card className="bg-blue-50/80 backdrop-blur-xl border border-blue-200/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-3">Available Offline Features:</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                GPS tracking and route recording
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                View previously cached map tiles
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                Access stored tracking sessions
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                Basic app functionality
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Data will sync automatically when connection is restored</p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage; 