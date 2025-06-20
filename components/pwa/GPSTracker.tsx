'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Pause, PlayCircle, RefreshCcw, Target, DownloadCloud, Map, Award, Loader2, Activity, Menu, Clock, Gauge, ChevronUp } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import { GPSTrackerProps, Calculations, OfflineData, TrackData } from './gps-tracker/types';
import MapComponent from './gps-tracker/MapComponent';
import ControlsComponent from './gps-tracker/ControlsComponent';
import StatsComponent from './gps-tracker/StatsComponent';
import ResultsModal from './gps-tracker/ResultsModal';
import { haversineDistance, formatTime } from './gps-tracker/utils';
import { getStoredLocation, saveLocationForOffline, storeDataForOfflineSync, syncOfflineData } from './gps-tracker/storage';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerPortal,
  DrawerOverlay,
} from "@/components/ui/drawer"
import {
  storeTrackingSession,
  getStoredTrackingSession,
  clearStoredTrackingSession,
  initBackgroundTracking,
  requestWakeLock,
  releaseWakeLock,
  BACKGROUND_TRACKING_INTERVAL
} from './gps-tracker/backgroundTracking';
import { GPSPosition } from './gps-tracker/backgroundTracking';

// Define the extended interfaces for Background Sync
interface SyncManager {
  register(tag: string): Promise<void>;
}

// Use interface augmentation instead of extension
interface ExtendedServiceWorkerRegistration {
  readonly sync?: SyncManager;
  // Include other standard ServiceWorkerRegistration properties
  readonly active: ServiceWorker | null;
  readonly installing: ServiceWorker | null;
  readonly waiting: ServiceWorker | null;
  readonly scope: string;
  getNotifications(options?: GetNotificationOptions): Promise<Notification[]>;
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
  update(): Promise<void>;
  unregister(): Promise<boolean>;
}

// Constants & configurations
const ZOOM_LEVEL = 16;
const MIN_DISTANCE_KM = 0.002;
const MIN_UPDATE_INTERVAL = 1000;
const BACKGROUND_UPDATE_INTERVAL = 5000; // 5 seconds interval when in background
const MIN_ACCURACY = 35;
const POSITION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
};
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri';

// Marker Icon Configuration
const currentPositionIcon = L.icon({
  iconUrl: '/icons/dog_emoji.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const startPositionIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjNGFkZTgwIiBkPSJNMTkyIDk2YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMyLTMyIDE0LjMtMzIgMzIgMTQuMyAzMiAzMiAzMnptMCA2NCAzMi0zMiA2NCA2NHY4NmMwIDE0LTkgMjYtMjAgMzRsLTUyLTUyaC0zMEwxMTIgNTAwYy0xMS4xLTcuOC0yMC01MC0yMC02NHYtODZsNjQtNjQgMzYgMzZ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOTIgNDE0aDMydjMySDE5MnYtMzJ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMTQgMjI1YzQuMSAwIDcuOCAyLjYgOS4zIDYuNWwxNS44IDQwLjljLjUgMS4zLjggMi42LjggNGwuMiAzMy44YzAgOC44LTcuMiAxNi0xNiAxNmgtMzJjLTguOCAwLTE2LTcuMi0xNi0xNmwtLjItMzMuOGMwLTEuNC4zLTIuNy43LTRsMTUuOC00MC45YzEuNS0zLjkgNS4yLTYuNSA5LjMtNi41aDE4LjR6Ii8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

const GpsTracker: React.FC<GPSTrackerProps> = ({ username, className = '' }) => {
  // Tracking states
  const [tracking, setTracking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  
  // Timing states
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number>(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Speed and stats state
  const [speed, setSpeed] = useState<number>(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [elevation, setElevation] = useState<number | null>(null);
  const [totalAscent, setTotalAscent] = useState<number>(0);
  const [totalDescent, setTotalDescent] = useState<number>(0);
  const [lastElevation, setLastElevation] = useState<number | null>(null);
  
  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  
  // Results and finish image state
  const [showResults, setShowResults] = useState<boolean>(false);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  
  // Trigger for recentering the map
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  
  // Reference for map container element for capturing
  const mapContainerRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);

  // Add elevations state
  const [elevations, setElevations] = useState<number[]>([]);

  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [backgroundMode, setBackgroundMode] = useState<boolean>(false);
  const backgroundTimerRef = useRef<number | null>(null);
  const positionsRef = useRef<GPSPosition[]>([]);
  const lastPositionRef = useRef<[number, number] | null>(null);

  const captureMapImage = useCallback(async () => {
    if (!mapContainerRef.current) return null;
    try {
      const canvas = await html2canvas(mapContainerRef.current!, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const imageData = canvas.toDataURL('image/png');
      setMapImage(imageData);
      return imageData;
    } catch (error) {
      console.error('Error capturing map image:', error);
      toast.error('Failed to capture route image');
      return null;
    }
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    
    if (backgroundTimerRef.current) {
      window.clearInterval(backgroundTimerRef.current);
      backgroundTimerRef.current = null;
    }
    
    if (wakeLock) {
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
    
    setTracking(false);
    setWatchId(null);
    setCompleted(true);
    
    // Clear stored session
    clearStoredTrackingSession();
    
    if (positions.length > 1) {
      setShowResults(true);
      captureMapImage();
    } else {
      toast.warning('No track data to save.');
    }
  }, [watchId, positions.length, captureMapImage, wakeLock]);

  const clearAllData = useCallback(() => {
    setPositions([]);
    setStartTime(null);
    setElapsedTime(0);
    setPauseDuration(0);
    setLastPauseTime(null);
    setCompleted(false);
    setSpeed(0);
    setMaxSpeed(0);
    setElevation(null);
    setTotalAscent(0);
    setTotalDescent(0);
    setLastElevation(null);
    setShowResults(false);
    setMapImage(null);
    setSaveSuccess(null);
  }, []);

  const calculations = useCallback((): Calculations => {
    const distance = (): string => {
      let total = 0;
      for (let i = 1; i < positions.length; i++) {
        total += haversineDistance(
          positions[i - 1].latitude,
          positions[i - 1].longitude,
          positions[i].latitude,
          positions[i].longitude
        );
      }
      return total.toFixed(2);
    };

    const avgSpeed = (): string => {
      if (elapsedTime === 0 || positions.length <= 1) return '0.0';
      const dist = parseFloat(distance());
      const avg = (dist * 3600) / elapsedTime;
      return avg.toFixed(1);
    };

    return { 
      distance, 
      avgSpeed,
      maxSpeed,
      totalAscent,
      totalDescent
    };
  }, [positions, elapsedTime, maxSpeed, totalAscent, totalDescent]);

  const { distance: calculateDistance, avgSpeed: calculateAverageSpeed } = calculations();

  useEffect(() => {
    setLoading(true);
    
    const checkPermission = async () => {
      try {
        const permStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permStatus.state === 'denied') {
          toast.error('Location access denied. Please enable location services for this site.');
          setLoading(false);
          return;
        }
        
        if (!navigator.onLine) {
          setIsOffline(true);
          const cached = getStoredLocation();
          if (cached) {
            setMapCenter(cached);
            toast.warning('You are offline. Using cached location data.');
            saveLocationForOffline(cached);
          } else {
            toast.error('No cached location available. Using default location.');
            const defaultLocation: [number, number] = [50.0755, 14.4378];
            setMapCenter(defaultLocation);
          }
          setLoading(false);
          return;
        }
        
        setIsOffline(false);
        let timeoutId: NodeJS.Timeout;
        
        const positionPromise = new Promise<GeolocationPosition>((resolve, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Location request timed out. Please check your GPS signal and try again.'));
          }, 10000); // 10 second timeout
          
        navigator.geolocation.getCurrentPosition(
          (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });

        const pos = await positionPromise;
            const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setMapCenter(loc);
            localStorage.setItem('lastKnownLocation', JSON.stringify(loc));
            saveLocationForOffline(loc);
            setLoading(false);
      } catch (error) {
        console.error('Permission check error:', error);
        setLoading(false);
        
        const cached = getStoredLocation();
        if (cached) {
          setMapCenter(cached);
          toast.warning('Using cached location due to error.');
        } else {
          toast.error('Could not get your location. Please check your GPS signal and try again.');
          const defaultLocation: [number, number] = [50.0755, 14.4378];
          setMapCenter(defaultLocation);
        }
      }
    };
    
    checkPermission();
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  useEffect(() => {
    if (!tracking) return;

    const interval = setInterval(() => {
      if (!paused) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tracking, paused]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tracking && startTime && !paused) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime - pauseDuration) / 1000));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [tracking, startTime, pauseDuration, paused]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (tracking && Notification.permission !== 'granted' && !isOffline) {
      Notification.requestPermission();
    }
  }, [tracking, isOffline]);

  useEffect(() => {
    let notifyInterval: NodeJS.Timeout;
    if (tracking && !paused && Notification.permission === 'granted' && !isOffline) {
      notifyInterval = setInterval(() => {
        new Notification('Tracking Active', {
          body: `Distance: ${calculateDistance()} km | Time: ${formatTime(elapsedTime)}`,
          icon: 'icons/dog_emoji.png',
        });
      }, 300000); // Reduced to 5 minutes to be less intrusive
    }
    return () => notifyInterval && clearInterval(notifyInterval);
  }, [tracking, elapsedTime, paused, isOffline, calculateDistance]);

  useEffect(() => {
    // Update ref whenever positions change
    positionsRef.current = positions;
  }, [positions]);

  // Handler for position updates
  const handlePosition = useCallback((position: Position) => {
    if (paused) return;
    if (position.coords.accuracy > MIN_ACCURACY * 2) {
      toast.warning(`Low GPS accuracy: ${position.coords.accuracy.toFixed(1)}m. Try moving to a more open area.`);
      return;
    }
    const newPos: GPSPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: position.timestamp,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude ?? undefined,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined
    };
    const currentTime = Date.now();
    
    // Handle elevation data
    if (position.coords.altitude !== null) {
      const currentElevation = position.coords.altitude;
      setElevation(currentElevation);
      setElevations(prev => [...prev, currentElevation]);
      
      if (lastElevation !== null && position.coords.altitudeAccuracy && position.coords.altitudeAccuracy < 10) {
        const elevationDiff = currentElevation - lastElevation;
        if (elevationDiff > 0.5) {
          setTotalAscent(prev => prev + elevationDiff);
        } else if (elevationDiff < -0.5) {
          setTotalDescent(prev => prev + Math.abs(elevationDiff));
        }
      }
      setLastElevation(currentElevation);
    } else {
      setElevations(prev => [...prev, prev.length > 0 ? prev[prev.length - 1] : 0]);
    }
    
    // Calculate speed
    let computedSpeed = position.coords.speed;
    if (computedSpeed === null && positions.length > 0 && lastUpdateTime) {
      const { latitude: lastLat, longitude: lastLon } = positions[positions.length - 1];
      const timeDiff = (currentTime - lastUpdateTime) / 1000;
      if (timeDiff > 0) {
        computedSpeed = haversineDistance(lastLat, lastLon, newPos.latitude, newPos.longitude) / timeDiff * 3600;
      }
    } else if (computedSpeed !== null) {
      computedSpeed *= 3.6;
    }
    
    if (computedSpeed !== null && computedSpeed >= 0) {
      setSpeed(prev => computedSpeed * 0.3 + prev * 0.7);
      if (computedSpeed > maxSpeed) {
        setMaxSpeed(computedSpeed);
      }
    }
    
    // Update positions array
    setPositions((prev) => {
      if (prev.length > 0) {
        const { latitude: lastLat, longitude: lastLon } = prev[prev.length - 1];
        const dist = haversineDistance(lastLat, lastLon, newPos.latitude, newPos.longitude);
        if (dist < MIN_DISTANCE_KM && lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL) {
          return prev;
        }
      }
  
      setLastUpdateTime(currentTime);
      setMapCenter([newPos.latitude, newPos.longitude]);
  
      const updatedPositions = [...prev, newPos];
      return updatedPositions;
    });
  }, [paused, positions, lastUpdateTime, lastElevation, maxSpeed]);

  // Error handler for geolocation
  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    console.error('Error watching position:', err);
    let errorMessage = 'Location error: ';
    switch (err.code) {
      case 1:
        errorMessage += 'Permission denied. Please enable location services.';
        stopTracking();
        break;
      case 2:
        errorMessage += 'Position unavailable. Check your GPS signal.';
        break;
      case 3:
        errorMessage += 'Position request timed out. Try again.';
        break;
      default:
        errorMessage += err.message;
    }
    if (!backgroundMode) {
      toast.error(errorMessage);
    }
  }, [backgroundMode, stopTracking]);

  // Initialize background tracking
  useEffect(() => {
    initBackgroundTracking((session) => {
      // This callback is called when the app comes back to foreground
      // and there might be new positions collected in the background
      if (session.positions.length > positions.length) {
        setPositions(session.positions);
        setElapsedTime(session.elapsedTime ?? 0);
        setPauseDuration(session.pauseDuration ?? 0);
        
        // Recenter map to the latest position
        if (session.positions.length > 0) {
          const lastPos = session.positions[session.positions.length - 1];
          setMapCenter([lastPos.latitude, lastPos.longitude]);
          setRecenterTrigger(prev => prev + 1);
        }
        
        toast.info('Updated with background tracking data');
      }
    });
    
    // Check for unfinished tracking sessions on startup
    const storedSession = getStoredTrackingSession();
    if (storedSession.isActive && storedSession.positions.length > 0 && !tracking) {
      // Ask user if they want to resume tracking
      const resumeSession = window.confirm('Found an unfinished tracking session. Would you like to resume it?');
      
      if (resumeSession) {
        setPositions(storedSession.positions);
        setStartTime(storedSession.startTime || Date.now());
        setElapsedTime(storedSession.elapsedTime || 0);
        setPauseDuration(storedSession.pauseDuration || 0);
        setPaused(storedSession.isPaused || false);
        setTracking(true);
        
        if (!storedSession.isPaused) {
          // Start tracking again
          const id = navigator.geolocation.watchPosition(
            handlePosition,
            handlePositionError,
            POSITION_OPTIONS
          );
          setWatchId(id);
        }
        
        toast.success('Resumed previous tracking session');
      } else {
        // Clear the unfinished session
        clearStoredTrackingSession();
      }
    }
    
    return () => {
      if (backgroundTimerRef.current) {
        window.clearInterval(backgroundTimerRef.current);
        backgroundTimerRef.current = null;
      }
    };
  }, [tracking, positions.length, handlePosition, handlePositionError]);

  // Handle visibility change (phone locked/unlocked)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setBackgroundMode(isHidden);
      
      if (tracking && !paused) {
        if (isHidden) {
          // Phone screen turned off - start background tracking
          console.log('App went to background, switching to background tracking');
          
          // Store current tracking state
          storeTrackingSession({
            positions: positionsRef.current,
            startTime: startTime ?? undefined,
            elapsedTime,
            pauseDuration,
            isActive: true,
            isPaused: false
          });
          
          // Clear watch and start interval-based polling
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
          }
          
          // Start background tracking using intervals
          if (!backgroundTimerRef.current) {
            backgroundTimerRef.current = window.setInterval(() => {
              navigator.geolocation.getCurrentPosition(
                handlePosition,
                handlePositionError,
                POSITION_OPTIONS
              );
            }, BACKGROUND_TRACKING_INTERVAL);
          }
        } else {
          // Phone screen turned on - switch back to watchPosition
          console.log('App returned to foreground, switching to foreground tracking');
          
          // Clear background interval
          if (backgroundTimerRef.current) {
            window.clearInterval(backgroundTimerRef.current);
            backgroundTimerRef.current = null;
          }
          
          // Load any positions collected in background
          const storedSession = getStoredTrackingSession();
          if (storedSession.positions.length > positions.length) {
            setPositions(storedSession.positions);
          }
          
          // Restart normal tracking
          if (!watchId) {
            const id = navigator.geolocation.watchPosition(
              handlePosition,
              handlePositionError,
              POSITION_OPTIONS
            );
            setWatchId(id);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tracking, paused, watchId, startTime, elapsedTime, pauseDuration, positions, handlePosition, handlePositionError]);

  // Request wake lock when tracking starts
  useEffect(() => {
    const setupWakeLock = async () => {
      if (tracking && !paused) {
        const lock = await requestWakeLock();
        if (lock) {
          setWakeLock(lock);
          
          lock.addEventListener('release', () => {
            console.log('Wake Lock released');
            setWakeLock(null);
          });
        }
      } else if (wakeLock) {
        releaseWakeLock(wakeLock);
        setWakeLock(null);
      }
    };
    
    setupWakeLock();
    
    return () => {
      if (wakeLock) {
        releaseWakeLock(wakeLock);
      }
    };
  }, [tracking, paused, wakeLock]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const startTimeValue = Date.now();
    
    setTracking(true);
    setCompleted(false);
    setShowResults(false);
    setMapImage(null);
    setStartTime(startTimeValue);
    setPauseDuration(0);
    setElapsedTime(0);
    setMaxSpeed(0);
    setTotalAscent(0);
    setTotalDescent(0);
    setLastElevation(null);
    setElevations([]);
    
    const id = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      POSITION_OPTIONS
    );
    setWatchId(id);
    
    // Store initial tracking state
    storeTrackingSession({
      positions: [],
      startTime: startTimeValue ?? undefined,
      elapsedTime: 0,
      pauseDuration: 0,
      isActive: true,
      isPaused: false
    });
    
    toast.success('GPS tracking started!');
    
    // Register for background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready
        .then((registration) => {
          const sw = registration as unknown as ExtendedServiceWorkerRegistration;
          if (sw.sync) {
            sw.sync.register('gps-tracking-sync')
              .then(() => {
                console.log('Background sync registered');
              })
              .catch((err) => {
                console.error('Background sync registration failed:', err);
              });
          }
        })
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });
    }
  }, [handlePosition, handlePositionError]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    setPaused(true);
    setLastPauseTime(Date.now());
    
    // Update stored state
    storeTrackingSession({
      positions,
      startTime: startTime ?? undefined,
      elapsedTime,
      pauseDuration,
      isActive: true,
      isPaused: true
    });
    
    toast.info('Tracking paused');
  }, [positions, startTime, elapsedTime, pauseDuration]);

  // Resume tracking
  const resumeTracking = useCallback(() => {
    if (lastPauseTime) {
      const updatedPauseDuration = pauseDuration + (Date.now() - lastPauseTime);
      setPauseDuration(updatedPauseDuration);
      
      // Update stored state
      storeTrackingSession({
        positions,
        startTime: startTime ?? undefined,
        elapsedTime,
        pauseDuration: updatedPauseDuration,
        isActive: true,
        isPaused: false
      });
    }
    
    setLastPauseTime(null);
    setPaused(false);
    toast.success('Tracking resumed');
  }, [lastPauseTime, pauseDuration, positions, startTime, elapsedTime]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    clearAllData();
    clearStoredTrackingSession();
    toast.info('Tracking reset');
  }, [clearAllData]);

  const recenterMap = useCallback(() => {
    if (isOffline) {
      const cached = getStoredLocation();
      if (cached) {
        setMapCenter(cached);
        setRecenterTrigger((prev) => prev + 1);
        toast.info('Using cached location (offline mode)');
      } else {
        toast.error('No cached location available');
      }
      return;
    }
    
    setLoading(true);
    let timeoutId: NodeJS.Timeout;
    
    const positionPromise = new Promise<GeolocationPosition>((resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out. Please check your GPS signal and try again.'));
      }, 10000);
      
    navigator.geolocation.getCurrentPosition(
      (pos) => {
          clearTimeout(timeoutId);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    positionPromise
      .then((pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(loc);
        setRecenterTrigger((prev) => prev + 1);
        localStorage.setItem('lastKnownLocation', JSON.stringify(loc));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error recentering map:', err);
        toast.error(`Location request timed out. Please check your GPS signal and try again.`);
      });
  }, [isOffline]);

  return (
    <div className={`${className} flex flex-col h-full`}>
      {/* Rest of the component content */}
    </div>
  );
};

export default GpsTracker;