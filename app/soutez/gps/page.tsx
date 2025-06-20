'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  Square, 
  MapPin, 
  Clock, 
  Navigation, 
  Activity, 
  Zap,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Settings,
  Download,
  Share2,
  Target,
  Compass,
  BarChart3,
  Layers,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Thermometer,
  Wind,
  Timer,
  Route,
  Gauge,
  TrendingUp,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  initBackgroundTracking, 
  storeTrackingSession, 
  getStoredTrackingSession, 
  clearStoredTrackingSession,
  calculateDistance,
  formatTime,
  getBatteryInfo,
  getTrackingSettings,
  saveTrackingSettings,
  syncOfflineData,
  EnhancedTrackingSession,
  GPSPosition
} from "@/components/pwa/gps-tracker/backgroundTracking";
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/editor/GpxEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
});

// Weather data interface
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

const GPSPage = () => {
  // Core tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<EnhancedTrackingSession | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  
  // UI state
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isServiceWorkerRegistered, setIsServiceWorkerRegistered] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Refs
  const sessionRef = useRef<EnhancedTrackingSession | null>(null);
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Register service worker for offline functionality
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          
          if (registration.installing) {
            console.log('Service worker installing');
          } else if (registration.waiting) {
            console.log('Service worker installed');
          } else if (registration.active) {
            console.log('Service worker active');
            setIsServiceWorkerRegistered(true);
          }
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  // Check online status and handle offline mode
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      setOfflineMode(!online);
      
      if (online) {
        toast.success('Connection restored');
        // Attempt to sync offline data
        syncOfflineData().catch(console.error);
      } else {
        toast.info('Working in offline mode', {
          description: 'GPS tracking will continue to work offline'
        });
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Initialize tracking session
  const initializeSession = useCallback(() => {
    const session: EnhancedTrackingSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      positions: [],
      totalDistance: 0,
      totalTime: 0,
      averageSpeed: 0,
      maxSpeed: 0,
      totalAscent: 0,
      totalDescent: 0,
      isActive: true,
      isPaused: false,
      lastUpdate: Date.now(),
      metadata: {
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screenResolution: `${screen.width}x${screen.height}`,
          connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType
        }
      },
      syncStatus: offlineMode ? 'pending' : 'pending',
      version: '2.0.0'
    };
    
    setCurrentSession(session);
    sessionRef.current = session;
    
    // Store in localStorage for offline persistence
    storeTrackingSession(session);
    
    return session;
  }, [offlineMode]);

  // Start timer updates
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      if (sessionRef.current && sessionRef.current.isActive && !sessionRef.current.isPaused) {
        const elapsed = Date.now() - sessionRef.current.startTime;
        setElapsedTime(elapsed);
        
        // Update session total time
        sessionRef.current.totalTime = elapsed;
        setCurrentSession({ ...sessionRef.current });
      }
    }, 1000);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Handle position updates
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const gpsPosition: GPSPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // Convert m/s to km/h
      heading: position.coords.heading || undefined,
      timestamp: position.timestamp
    };

    setCurrentPosition(gpsPosition);

    if (sessionRef.current && sessionRef.current.isActive && !sessionRef.current.isPaused) {
      const session = sessionRef.current;
      
      // Calculate distance if we have a previous position
      if (lastPositionRef.current) {
        const distance = calculateDistance(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude,
          gpsPosition.latitude,
          gpsPosition.longitude
        );
        
        session.totalDistance += distance;
        
        // Calculate ascent/descent
        if (gpsPosition.altitude && lastPositionRef.current.altitude) {
          const elevationDiff = gpsPosition.altitude - lastPositionRef.current.altitude;
          if (elevationDiff > 0) {
            session.totalAscent += elevationDiff;
          } else {
            session.totalDescent += Math.abs(elevationDiff);
          }
        }
        
        // Update max speed
        if (gpsPosition.speed && gpsPosition.speed > session.maxSpeed) {
          session.maxSpeed = gpsPosition.speed;
        }
      }
      
      // Add position to session
      session.positions.push(gpsPosition);
      session.totalTime = Date.now() - session.startTime;
      session.averageSpeed = session.totalDistance / (session.totalTime / 3600000); // km/h
      
      // Update session state
      setCurrentSession({ ...session });
      sessionRef.current = session;
      
      // Store updated session
      storeTrackingSession(session);
    }
    
    lastPositionRef.current = gpsPosition;
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('GPS is not supported on this device');
      return;
    }

    setIsLoading(true);

    try {
      const session = initializeSession();
      
      // Request wake lock to keep screen on
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired');
        } catch (error) {
          console.warn('Failed to acquire wake lock:', error);
        }
      }
      
      const id = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => {
          console.error('GPS Error:', error);
          toast.error(`GPS Error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      setIsPaused(false);
      
      // Start timer
      startTimer();
      
      toast.success(offlineMode ? 'GPS tracking started (offline mode)' : 'GPS tracking started');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      toast.error('Failed to start tracking');
    } finally {
      setIsLoading(false);
    }
  }, [initializeSession, handlePositionUpdate, startTimer, offlineMode]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.isPaused = true;
      setCurrentSession({ ...sessionRef.current });
      setIsPaused(true);
      storeTrackingSession(sessionRef.current);
      toast.info('Tracking paused');
    }
  }, []);

  // Resume tracking
  const resumeTracking = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.isPaused = false;
      setCurrentSession({ ...sessionRef.current });
      setIsPaused(false);
      storeTrackingSession(sessionRef.current);
      toast.info('Tracking resumed');
    }
  }, []);

  // Stop tracking
  const stopTracking = useCallback(async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    // Stop timer
    stopTimer();
    
    // Release wake lock
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake lock released');
      } catch (error) {
        console.error('Error releasing wake lock:', error);
      }
    }
    
    if (sessionRef.current) {
      sessionRef.current.isActive = false;
      sessionRef.current.endTime = Date.now();
      setCurrentSession({ ...sessionRef.current });
      
      // Save completed session
      const completedSessions = JSON.parse(localStorage.getItem('completedSessions') || '[]');
      completedSessions.push(sessionRef.current);
      localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
      
      // Clear current session
      clearStoredTrackingSession();
      sessionRef.current = null;
    }
    
    setIsTracking(false);
    setIsPaused(false);
    setCurrentPosition(null);
    setElapsedTime(0);
    
    toast.success('Tracking stopped');
  }, [watchId, stopTimer]);

  // Check battery status
  useEffect(() => {
    const updateBatteryInfo = async () => {
      const batteryInfo = await getBatteryInfo();
      if (batteryInfo) {
        setBatteryLevel(batteryInfo.level);
        setIsCharging(batteryInfo.charging);
      }
    };
    
    updateBatteryInfo();
    
    // Update battery info periodically
    const batteryInterval = setInterval(updateBatteryInfo, 30000); // Every 30 seconds
    
    return () => clearInterval(batteryInterval);
  }, []);

  // Initialize background tracking
  useEffect(() => {
    initBackgroundTracking(
      (session) => {
        // Resume tracking callback
        setCurrentSession(session);
        sessionRef.current = session;
        setIsTracking(true);
        setIsPaused(session.isPaused);
        if (!session.isPaused) {
          startTimer();
        }
      },
      (position) => {
        // Position update callback from background
        setCurrentPosition(position);
        handlePositionUpdate({
          coords: {
            latitude: position.latitude,
            longitude: position.longitude,
            altitude: position.altitude,
            accuracy: position.accuracy,
            speed: position.speed ? position.speed / 3.6 : undefined, // Convert back to m/s
            heading: position.heading
          },
          timestamp: position.timestamp
        } as GeolocationPosition);
      }
    );
  }, [handlePositionUpdate, startTimer]);

  // Load existing session on mount
  useEffect(() => {
    const savedSession = getStoredTrackingSession();
    if (savedSession && savedSession.isActive) {
      setCurrentSession(savedSession);
      sessionRef.current = savedSession;
      setIsTracking(true);
      setIsPaused(savedSession.isPaused);
      
      // Resume tracking if not paused
      if (!savedSession.isPaused) {
        startTracking();
      }
    }
  }, [startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Convert session positions to map format
  const mapTrackPoints = currentSession?.positions.map(pos => ({
    lat: pos.latitude,
    lng: pos.longitude,
    ele: pos.altitude
  })) || [];

  return (
    <CommonPageTemplate contents={{}} currentUser={undefined} currentRole={undefined} className='h-screen max-h-screen overflow-y-hidden p-0'>
      <div className="h-screen max-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        {/* Mobile layout (no border, full width) */}
        <div className="md:hidden w-full h-full bg-white/80 backdrop-blur-xl overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Status Bar */}
            <div className="flex items-center justify-between text-xs text-gray-600 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/50">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                {offlineMode && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-2 w-2 text-amber-500" />
                    <span className="text-amber-600 text-xs">Offline Mode</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isCharging ? (
                  <BatteryCharging className="h-3 w-3 text-green-500" />
                ) : (
                  <Battery className="h-3 w-3" />
                )}
                <span className="font-medium">{batteryLevel}%</span>
              </div>
            </div>

            {/* Offline Mode Notice */}
            {offlineMode && (
              <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100/80">
                    <WifiOff className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 text-sm">Offline Mode</h3>
                    <p className="text-amber-700 text-xs">GPS tracking continues offline. Data will sync when connection is restored.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Position Display */}
            {currentPosition && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 border border-blue-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-blue-100/80 backdrop-blur-sm">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Current Position</h3>
                    <p className="text-sm text-gray-600">GPS Active</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <span className="text-gray-500 text-xs font-medium">Latitude</span>
                    <p className="font-mono text-gray-900 font-semibold">{currentPosition.latitude.toFixed(6)}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <span className="text-gray-500 text-xs font-medium">Longitude</span>
                    <p className="font-mono text-gray-900 font-semibold">{currentPosition.longitude.toFixed(6)}</p>
                  </div>
                  {currentPosition.altitude && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-500 text-xs font-medium">Altitude</span>
                      <p className="font-mono text-gray-900 font-semibold">{currentPosition.altitude.toFixed(0)}m</p>
                    </div>
                  )}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                    <span className="text-gray-500 text-xs font-medium">Accuracy</span>
                    <p className="font-mono text-gray-900 font-semibold">{currentPosition.accuracy.toFixed(1)}m</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Controls */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-center gap-6">
                {!isTracking ? (
                  <Button
                    onClick={startTracking}
                    disabled={isLoading}
                    className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                    ) : (
                      <Play className="h-10 w-10" />
                    )}
                  </Button>
                ) : (
                  <>
                    {isPaused ? (
                      <Button
                        onClick={resumeTracking}
                        className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                      >
                        <Play className="h-10 w-10" />
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseTracking}
                        className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                      >
                        <Pause className="h-10 w-10" />
                      </Button>
                    )}
                    <Button
                      onClick={stopTracking}
                      className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      <Square className="h-10 w-10" />
                    </Button>
                  </>
                )}
              </div>
              <p className="text-center text-sm text-gray-600 mt-4 font-medium">
                {!isTracking ? 'Start tracking your route' : 
                 isPaused ? 'Tracking paused' : 'Tracking active'}
              </p>
            </div>

            {/* Live Stats */}
            {currentSession && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-purple-100/80 backdrop-blur-sm">
                    <Activity className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">Live Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {currentSession.totalDistance.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">km</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatTime(elapsedTime || currentSession.totalTime)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">time</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {currentSession.averageSpeed.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">km/h avg</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {currentSession.maxSpeed.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">km/h max</div>
                  </div>
                </div>
              </div>
            )}

            {/* Map Section */}
            {showMap && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-blue-100/80">
                    <Layers className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Live Map</h3>
                </div>
                <div className="h-64 rounded-2xl overflow-hidden border border-gray-200/50">
                  {mapTrackPoints.length > 0 ? (
                    <MapComponent
                      onSave={() => {}}
                      initialTrack={mapTrackPoints}
                      readOnly={true}
                      hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify']}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Start tracking to see your route</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowMap(!showMap)}
                className="h-12 bg-white/60 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 transition-all duration-300 rounded-2xl"
              >
                <Layers className="h-4 w-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStats(!showStats)}
                className="h-12 bg-white/60 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 transition-all duration-300 rounded-2xl"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
            </div>

            {/* Weather Info */}
            {weather && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 border border-blue-200/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-100/80 backdrop-blur-sm">
                      <Thermometer className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{weather.temperature}°C</div>
                      <div className="text-sm text-gray-600">{weather.condition}</div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600 space-y-1">
                    <div>Humidity: {weather.humidity}%</div>
                    <div>Wind: {weather.windSpeed} km/h</div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-200/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100/80 backdrop-blur-sm">
                    <Settings className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">Settings</span>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop layout (phone-like design with border) */}
        <div className="hidden md:block mx-auto max-w-sm w-full h-full max-h-screen bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-8 border-gray-800 overflow-hidden">
          <ScrollArea className="h-full w-full p-4">
            <div className="space-y-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between text-xs text-gray-600 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/50">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                  {offlineMode && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-2 w-2 text-amber-500" />
                      <span className="text-amber-600 text-xs">Offline Mode</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isCharging ? (
                    <BatteryCharging className="h-3 w-3 text-green-500" />
                  ) : (
                    <Battery className="h-3 w-3" />
                  )}
                  <span className="font-medium">{batteryLevel}%</span>
                </div>
              </div>

              {/* Offline Mode Notice */}
              {offlineMode && (
                <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-4 border border-amber-200/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-100/80">
                      <WifiOff className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 text-sm">Offline Mode</h3>
                      <p className="text-amber-700 text-xs">GPS tracking continues offline. Data will sync when connection is restored.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Position Display */}
              {currentPosition && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-blue-100/80 backdrop-blur-sm">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">Current Position</h3>
                      <p className="text-sm text-gray-600">GPS Active</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-500 text-xs font-medium">Latitude</span>
                      <p className="font-mono text-gray-900 font-semibold">{currentPosition.latitude.toFixed(6)}</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-500 text-xs font-medium">Longitude</span>
                      <p className="font-mono text-gray-900 font-semibold">{currentPosition.longitude.toFixed(6)}</p>
                    </div>
                    {currentPosition.altitude && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                        <span className="text-gray-500 text-xs font-medium">Altitude</span>
                        <p className="font-mono text-gray-900 font-semibold">{currentPosition.altitude.toFixed(0)}m</p>
                      </div>
                    )}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3">
                      <span className="text-gray-500 text-xs font-medium">Accuracy</span>
                      <p className="font-mono text-gray-900 font-semibold">{currentPosition.accuracy.toFixed(1)}m</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking Controls */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                <div className="flex items-center justify-center gap-6">
                  {!isTracking ? (
                    <Button
                      onClick={startTracking}
                      disabled={isLoading}
                      className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl disabled:opacity-50 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                      ) : (
                        <Play className="h-10 w-10" />
                      )}
                    </Button>
                  ) : (
                    <>
                      {isPaused ? (
                        <Button
                          onClick={resumeTracking}
                          className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                          <Play className="h-10 w-10" />
                        </Button>
                      ) : (
                        <Button
                          onClick={pauseTracking}
                          className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                          <Pause className="h-10 w-10" />
                        </Button>
                      )}
                      <Button
                        onClick={stopTracking}
                        className="h-20 w-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                      >
                        <Square className="h-10 w-10" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-center text-sm text-gray-600 mt-4 font-medium">
                  {!isTracking ? 'Start tracking your route' : 
                   isPaused ? 'Tracking paused' : 'Tracking active'}
                </p>
              </div>

              {/* Live Stats */}
              {currentSession && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-purple-100/80 backdrop-blur-sm">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Live Stats</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {currentSession.totalDistance.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">km</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatTime(elapsedTime || currentSession.totalTime)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">time</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {currentSession.averageSpeed.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">km/h avg</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {currentSession.maxSpeed.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">km/h max</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Section */}
              {showMap && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-blue-100/80">
                      <Layers className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Live Map</h3>
                  </div>
                  <div className="h-64 rounded-2xl overflow-hidden border border-gray-200/50">
                    {mapTrackPoints.length > 0 ? (
                      <MapComponent
                        onSave={() => {}}
                        initialTrack={mapTrackPoints}
                        readOnly={true}
                        hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify']}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Start tracking to see your route</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMap(!showMap)}
                  className="h-12 bg-white/60 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 transition-all duration-300 rounded-2xl"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowStats(!showStats)}
                  className="h-12 bg-white/60 backdrop-blur-sm border-gray-200/50 hover:bg-white/80 transition-all duration-300 rounded-2xl"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                  </Button>
              </div>

              {/* Weather Info */}
              {weather && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-blue-100/80 backdrop-blur-sm">
                        <Thermometer className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{weather.temperature}°C</div>
                        <div className="text-sm text-gray-600">{weather.condition}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-600 space-y-1">
                      <div>Humidity: {weather.humidity}%</div>
                      <div>Wind: {weather.windSpeed} km/h</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-200/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100/80 backdrop-blur-sm">
                      <Settings className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">Settings</span>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default GPSPage;