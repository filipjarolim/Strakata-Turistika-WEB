'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { currentRole, currentUser } from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GPSLoadingScreen } from "@/components/ui/GPSLoadingScreen";
import { OfflineController } from "@/components/ui/OfflineController";
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
import { shouldEnableOffline } from '@/lib/dev-utils';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(
  () => import('@/components/editor/GpxEditor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
);

// Simple lightweight map component for GPS tracking
const SimpleMapComponent = dynamic(
  () => import('@/components/pwa/gps-tracker/SimpleMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
);

// Fallback map component in case the main map fails to load
const FallbackMap = () => (
  <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200/50">
    <div className="text-center">
      <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
      <p className="text-sm text-gray-600 font-medium">Map Loading...</p>
      <p className="text-xs text-gray-500 mt-1">Please wait while the map initializes</p>
    </div>
  </div>
);

// Simple static map fallback
const StaticMapFallback = ({ trackPoints }: { trackPoints: { lat: number; lng: number }[] }) => {
  if (trackPoints.length === 0) {
    return <FallbackMap />;
  }

  return (
    <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Route Overview</span>
        </div>
        <span className="text-xs text-gray-500">{trackPoints.length} points</span>
      </div>
      
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 h-32 overflow-hidden">
        <div className="text-xs text-gray-600 mb-2">GPS Track</div>
        <div className="flex items-center gap-1">
          {trackPoints.slice(0, 20).map((point, index) => (
            <div
              key={index}
              className="w-1 h-1 bg-blue-500 rounded-full"
              style={{
                opacity: index / Math.min(trackPoints.length, 20)
              }}
            />
          ))}
          {trackPoints.length > 20 && (
            <span className="text-xs text-gray-400">...</span>
          )}
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/40 rounded-lg p-2">
            <div className="text-gray-500">Start</div>
            <div className="font-mono text-gray-700">
              {trackPoints[0]?.lat.toFixed(4)}, {trackPoints[0]?.lng.toFixed(4)}
            </div>
          </div>
          <div className="bg-white/40 rounded-lg p-2">
            <div className="text-gray-500">Current</div>
            <div className="font-mono text-gray-700">
              {trackPoints[trackPoints.length - 1]?.lat.toFixed(4)}, {trackPoints[trackPoints.length - 1]?.lng.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Error boundary for map component
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map Error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return <FallbackMap />;
    }

    return this.props.children;
  }
}

// Weather data interface
interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
}

const GPSPage = () => {
  // Loading state
  const [isGPSReady, setIsGPSReady] = useState(false);
  
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
  const [mapError, setMapError] = useState(false);
  
  // Developer stats
  const [developerStats, setDeveloperStats] = useState({
    totalDistanceMeters: 0,
    lastUpdateTime: null as Date | null,
    updateCount: 0,
    averageUpdateInterval: 0,
    lastUpdateInterval: 0,
    gpsAccuracy: 0,
    gpsSpeed: 0,
    gpsHeading: 0
  });
  
  // Refs
  const sessionRef = useRef<EnhancedTrackingSession | null>(null);
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle GPS ready callback
  const handleGPSReady = useCallback(() => {
    setIsGPSReady(true);
  }, []);

  // Register service worker for offline functionality
  useEffect(() => {
    // Disable service worker in development unless offline is enabled
    if (!shouldEnableOffline()) {
      console.log('Service worker registration disabled in development mode');
      return;
    }
    
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

    // Update developer stats
    const now = new Date();
    setDeveloperStats(prev => {
      const lastUpdateTime = prev.lastUpdateTime;
      const updateInterval = lastUpdateTime ? now.getTime() - lastUpdateTime.getTime() : 0;
      const newUpdateCount = prev.updateCount + 1;
      const newAverageInterval = lastUpdateTime 
        ? (prev.averageUpdateInterval * (newUpdateCount - 1) + updateInterval) / newUpdateCount
        : 0;

      return {
        ...prev,
        lastUpdateTime: now,
        updateCount: newUpdateCount,
        averageUpdateInterval: newAverageInterval,
        lastUpdateInterval: updateInterval,
        gpsAccuracy: position.coords.accuracy,
        gpsSpeed: position.coords.speed || 0,
        gpsHeading: position.coords.heading || 0
      };
    });

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
        
        // Update developer stats with precise distance in meters
        setDeveloperStats(prev => ({
          ...prev,
          totalDistanceMeters: Math.round(prev.totalDistanceMeters + (distance * 1000))
        }));
        
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
          let errorMessage = 'GPS Error';
          switch (error.code) {
            case 1:
              errorMessage = 'GPS access denied. Please enable location services.';
              break;
            case 2:
              errorMessage = 'GPS position unavailable. Please check your location settings.';
              break;
            case 3:
              errorMessage = 'GPS timeout. Please try again or move to an open area.';
              break;
            default:
              errorMessage = `GPS Error: ${error.message}`;
          }
          toast.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 30000 // Increased timeout to 30 seconds
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

  // Handle global errors for map loading
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('chunk') || event.message.includes('4867')) {
        console.warn('Map chunk loading error detected, showing fallback');
        setMapError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Retry map loading
  const retryMap = () => {
    setMapError(false);
    // Force a re-render by updating a state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Show loading screen if GPS is not ready
  if (!isGPSReady) {
    return <GPSLoadingScreen onReady={handleGPSReady} isOnline={isOnline} />;
  }

  // Convert session positions to map format
  const mapTrackPoints = currentSession?.positions.map(pos => ({
    lat: pos.latitude,
    lng: pos.longitude,
    ele: pos.altitude
  })) || [];

  return (
    <CommonPageTemplate contents={{}} currentUser={undefined} currentRole={undefined} className='h-screen max-h-screen overflow-y-hidden p-0' showOfflineController={true}>
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
                  <MapErrorBoundary onError={() => setMapError(true)}>
                    {mapError ? (
                      <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl flex items-center justify-center border border-red-200/50">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 font-medium">Map Unavailable</p>
                          <p className="text-xs text-gray-500 mt-1">Please try refreshing the page</p>
                          <button 
                            onClick={() => setMapError(false)}
                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    ) : mapTrackPoints.length > 0 ? (
                      <MapErrorBoundary onError={() => setMapError(true)}>
                        <SimpleMapComponent trackPoints={mapTrackPoints} />
                      </MapErrorBoundary>
                    ) : (
                      <StaticMapFallback trackPoints={mapTrackPoints} />
                    )}
                  </MapErrorBoundary>
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

            {/* Developer Stats */}
            {showStats && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-purple-100/80 backdrop-blur-sm">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">Developer Stats</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {developerStats.totalDistanceMeters}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">meters</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {developerStats.updateCount}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">updates</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {developerStats.averageUpdateInterval > 0 ? Math.round(developerStats.averageUpdateInterval / 1000) : 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">avg sec</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200/50">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {developerStats.gpsAccuracy.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">accuracy m</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Last update:</span>
                    <span>{developerStats.lastUpdateTime ? developerStats.lastUpdateTime.toLocaleTimeString() : 'Never'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last interval:</span>
                    <span>{developerStats.lastUpdateInterval > 0 ? Math.round(developerStats.lastUpdateInterval / 1000) : 0}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Speed:</span>
                    <span>{(developerStats.gpsSpeed * 3.6).toFixed(1)} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GPS Heading:</span>
                    <span>{developerStats.gpsHeading.toFixed(0)}°</span>
                  </div>
                </div>
              </div>
            )}
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
                    <MapErrorBoundary onError={() => setMapError(true)}>
                      {mapError ? (
                        <div className="w-full h-full bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl flex items-center justify-center border border-red-200/50">
                          <div className="text-center">
                            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 font-medium">Map Unavailable</p>
                            <p className="text-xs text-gray-500 mt-1">Please try refreshing the page</p>
                            <button 
                              onClick={() => setMapError(false)}
                              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        </div>
                      ) : mapTrackPoints.length > 0 ? (
                        <MapErrorBoundary onError={() => setMapError(true)}>
                          <SimpleMapComponent trackPoints={mapTrackPoints} />
                        </MapErrorBoundary>
                      ) : (
                        <StaticMapFallback trackPoints={mapTrackPoints} />
                      )}
                    </MapErrorBoundary>
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

              {/* Developer Stats */}
              {showStats && (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-purple-100/80 backdrop-blur-sm">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">Developer Stats</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center border border-purple-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {developerStats.totalDistanceMeters}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">meters</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center border border-blue-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {developerStats.updateCount}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">updates</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center border border-green-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {developerStats.averageUpdateInterval > 0 ? Math.round(developerStats.averageUpdateInterval / 1000) : 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">avg sec</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200/50">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {developerStats.gpsAccuracy.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">accuracy m</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Last update:</span>
                      <span>{developerStats.lastUpdateTime ? developerStats.lastUpdateTime.toLocaleTimeString() : 'Never'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last interval:</span>
                      <span>{developerStats.lastUpdateInterval > 0 ? Math.round(developerStats.lastUpdateInterval / 1000) : 0}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GPS Speed:</span>
                      <span>{(developerStats.gpsSpeed * 3.6).toFixed(1)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GPS Heading:</span>
                      <span>{developerStats.gpsHeading.toFixed(0)}°</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </CommonPageTemplate>
  );
};

export default GPSPage;