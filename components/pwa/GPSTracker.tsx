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
import { GPSTrackerProps, Calculations, OfflineData, TrackData, Position } from './gps-tracker/types';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Terminal } from 'lucide-react';

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
const MIN_ACCURACY = 35;
const STATIONARY_THRESHOLD_KM = 0.002;
const STATIONARY_TIME_THRESHOLD = 10000;
const SPEED_FILTER_THRESHOLD = 0.5;
const POSITION_HISTORY_SIZE = 20;
const MAX_GAP_INTERPOLATION = 300000; // 5 minutes
const POSITION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
};
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri';
const UPDATE_INTERVAL = 5000; // 5 seconds

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

const GpsTracker: React.FC<GPSTrackerProps> = ({ username, className = '' }) => {
  // Tracking states
  const [tracking, setTracking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [positions, setPositions] = useState<Position[]>([]);
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

  // Add new state variables for background sync
  const [lastStoredPosition, setLastStoredPosition] = useState<[number, number] | null>(null);
  const [lastStoredTime, setLastStoredTime] = useState<number | null>(null);
  const [backgroundSyncRegistered, setBackgroundSyncRegistered] = useState<boolean>(false);

  // Add new state variables for stationary detection
  const [isStationary, setIsStationary] = useState<boolean>(false);
  const [stationaryStartTime, setStationaryStartTime] = useState<number | null>(null);
  const [lastValidPosition, setLastValidPosition] = useState<[number, number] | null>(null);
  const [positionHistory, setPositionHistory] = useState<Array<{ pos: [number, number], time: number }>>([]);

  // Add new state variables for gap handling
  const [lastKnownPosition, setLastKnownPosition] = useState<[number, number] | null>(null);
  const [lastKnownTime, setLastKnownTime] = useState<number | null>(null);
  const [interpolatedPositions, setInterpolatedPositions] = useState<[number, number][]>([]);

  // Development console state
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [consoleLog, setConsoleLog] = useState<Array<{
    type: 'info' | 'error' | 'position';
    message: string;
    timestamp: number;
  }>>([]);

  // Add log entry to console
  const addLog = useCallback((type: 'info' | 'error' | 'position', message: string) => {
    setConsoleLog(prev => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);

  // Clear all data
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
    setConsoleLog([]);
    addLog('info', 'All tracking data cleared');
  }, [addLog]);

  const calculations = useCallback((): Calculations => {
    const distance = (): string => {
      let total = 0;
      for (let i = 1; i < positions.length; i++) {
        total += haversineDistance(
          positions[i - 1].lat,
          positions[i - 1].lng,
          positions[i].lat,
          positions[i].lng
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

  const stopTracking = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
    setWatchId(null);
    setCompleted(true);
    
    if (positions.length > 1) {
      setShowResults(true);
      captureMapImage();
    } else {
      toast.warning('No track data to save.');
    }
  }, [watchId, positions.length, captureMapImage]);

  // Function to interpolate positions between two points
  const interpolatePositions = useCallback((startPos: [number, number], endPos: [number, number], 
                                          startTime: number, endTime: number, 
                                          maxGap: number = MAX_GAP_INTERPOLATION) => {
    const timeDiff = endTime - startTime;
    if (timeDiff > maxGap) return []; // Don't interpolate for large gaps
    
    const distance = haversineDistance(startPos[0], startPos[1], endPos[0], endPos[1]);
    const speed = distance / (timeDiff / 3600000); // km/h
    
    // Only interpolate if speed is reasonable (less than 30 km/h)
    if (speed > 30) return [];
    
    const numPoints = Math.ceil(timeDiff / 10000); // One point every 10 seconds
    const interpolated: [number, number][] = [];
    
    for (let i = 1; i < numPoints; i++) {
      const ratio = i / numPoints;
      const lat = startPos[0] + (endPos[0] - startPos[0]) * ratio;
      const lng = startPos[1] + (endPos[1] - startPos[1]) * ratio;
      interpolated.push([lat, lng]);
    }
    
    return interpolated;
  }, []);

  // Function to handle visibility change (phone turned off/on)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && tracking && !paused) {
        // Phone was turned back on
        if (lastKnownPosition && lastKnownTime) {
          const currentTime = Date.now();
          const timeDiff = currentTime - lastKnownTime;
          
          if (timeDiff > 10000) { // More than 10 seconds gap
            toast.info('Resuming tracking after phone was turned off');
            
            // Get current position
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const currentPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                
                // Interpolate positions for the gap
                const interpolated = interpolatePositions(
                  lastKnownPosition,
                  currentPos,
                  lastKnownTime,
                  currentTime
                );
                
                if (interpolated.length > 0) {
                  setInterpolatedPositions(prev => [...prev, ...interpolated]);
                  setPositions(prev => [...prev, ...interpolated.map(([lat, lng]) => ({
                    lat,
                    lng,
                    timestamp: currentTime,
                    accuracy: pos.coords.accuracy,
                    speed: pos.coords.speed ? pos.coords.speed * 3.6 : null
                  })), {
                    lat: currentPos[0],
                    lng: currentPos[1],
                    timestamp: currentTime,
                    accuracy: pos.coords.accuracy,
                    speed: pos.coords.speed ? pos.coords.speed * 3.6 : null
                  }]);
                } else {
                  setPositions(prev => [...prev, {
                    lat: currentPos[0],
                    lng: currentPos[1],
                    timestamp: currentTime,
                    accuracy: pos.coords.accuracy,
                    speed: pos.coords.speed ? pos.coords.speed * 3.6 : null
                  }]);
                }
                
                setLastKnownPosition(currentPos);
                setLastKnownTime(currentTime);
              },
              (err) => {
                console.error('Error getting position after phone turned on:', err);
              },
              POSITION_OPTIONS
            );
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tracking, paused, lastKnownPosition, lastKnownTime, interpolatePositions]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setTracking(true);
    setCompleted(false);
    setShowResults(false);
    setMapImage(null);
    setStartTime(Date.now());
    setPauseDuration(0);
    setElapsedTime(0);
    setMaxSpeed(0);
    setTotalAscent(0);
    setTotalDescent(0);
    setLastElevation(null);
    setElevations([]);
    setLastStoredPosition(null);
    setLastStoredTime(null);
    setIsStationary(false);
    setStationaryStartTime(null);
    setLastValidPosition(null);
    setPositionHistory([]);
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window && !backgroundSyncRegistered) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('gps-tracking').then(() => {
          setBackgroundSyncRegistered(true);
        }).catch(err => {
          console.error('Background sync registration failed:', err);
        });
      });
    }
    
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (paused) return;
        
        if (pos.coords.accuracy > MIN_ACCURACY * 2) {
          toast.warning(`Low GPS accuracy: ${pos.coords.accuracy.toFixed(1)}m. Try moving to a more open area.`);
          return;
        }

        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const currentTime = Date.now();
        
        // Store last known position for gap handling
        setLastKnownPosition(newPos);
        setLastKnownTime(currentTime);
        
        // Update position history
        setPositionHistory(prev => {
          const updated = [...prev, { pos: newPos, time: currentTime }];
          // Keep only last POSITION_HISTORY_SIZE positions for drift detection
          return updated.slice(-POSITION_HISTORY_SIZE);
        });
        
        // Check if we're stationary with improved detection
        if (positionHistory.length > 0) {
          const avgDistance = positionHistory.reduce((sum, { pos }) => {
            return sum + haversineDistance(pos[0], pos[1], newPos[0], newPos[1]);
          }, 0) / positionHistory.length;
          
          // Check if all recent positions are within the stationary threshold
          const allPositionsStationary = positionHistory.every(({ pos }) => 
            haversineDistance(pos[0], pos[1], newPos[0], newPos[1]) < STATIONARY_THRESHOLD_KM
          );
          
          if (avgDistance < STATIONARY_THRESHOLD_KM && allPositionsStationary) {
            if (!isStationary) {
              setIsStationary(true);
              setStationaryStartTime(currentTime);
            }
          } else {
            setIsStationary(false);
            setStationaryStartTime(null);
          }
        }
        
        // Only update position if we're moving or if we've been stationary for a while
        if (!isStationary || (stationaryStartTime && currentTime - stationaryStartTime > STATIONARY_TIME_THRESHOLD)) {
          setLastValidPosition(newPos);
          setPositions(prev => {
            if (prev.length > 0) {
              const lastPos = prev[prev.length - 1];
              const dist = haversineDistance(lastPos.lat, lastPos.lng, newPos[0], newPos[1]);
              if (dist < MIN_DISTANCE_KM && lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL) {
                return prev;
              }
            }
            setLastUpdateTime(currentTime);
            setMapCenter(newPos);
            return [...prev, {
              lat: newPos[0],
              lng: newPos[1],
              timestamp: currentTime,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed ? pos.coords.speed * 3.6 : null
            }];
          });
        }
        
        // Calculate speed with improved drift filtering
        let speedValue = pos.coords.speed;
        if (speedValue === null && lastValidPosition && lastUpdateTime) {
          const timeDiff = (currentTime - lastUpdateTime) / 1000;
          if (timeDiff > 0) {
            const dist = haversineDistance(
              lastValidPosition[0],
              lastValidPosition[1],
              newPos[0],
              newPos[1]
            );
            speedValue = dist / timeDiff * 3600;
            
            // More aggressive speed filtering when stationary
            if (isStationary || speedValue < SPEED_FILTER_THRESHOLD) {
              speedValue = 0;
            }
          }
        } else if (speedValue !== null) {
          speedValue *= 3.6;
          
          // More aggressive speed filtering when stationary
          if (isStationary || speedValue < SPEED_FILTER_THRESHOLD) {
            speedValue = 0;
          }
        }
        
        if (speedValue !== null && speedValue >= 0) {
          setSpeed(prev => {
            // Use more aggressive exponential moving average for smoother speed display
            const alpha = 0.2; // Reduced from 0.3 for more smoothing
            const newSpeed = speedValue * alpha + prev * (1 - alpha);
            
            // Force zero speed when stationary or below threshold
            if (isStationary || newSpeed < SPEED_FILTER_THRESHOLD) {
              return 0;
            }
            return newSpeed;
          });
          
          if (speedValue > maxSpeed) {
            setMaxSpeed(speedValue);
          }
        }
        
        if (pos.coords.altitude !== null) {
          const currentElevation = pos.coords.altitude;
          setElevation(currentElevation);
          setElevations(prev => [...prev, currentElevation]);
          
          if (lastElevation !== null && pos.coords.altitudeAccuracy && pos.coords.altitudeAccuracy < 10) {
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
        
        // Store position for offline sync
        if (lastStoredPosition === null || 
            haversineDistance(lastStoredPosition[0], lastStoredPosition[1], newPos[0], newPos[1]) > MIN_DISTANCE_KM ||
            currentTime - (lastStoredTime || 0) > 30000) { // Store at least every 30 seconds
          setLastStoredPosition(newPos);
          setLastStoredTime(currentTime);
          saveLocationForOffline(newPos);
          
          // Store track data for offline sync
          const trackData: OfflineData = {
            positions: positions.map(({ lat, lng }) => [lat, lng] as [number, number]),
            timestamp: currentTime,
            elapsedTime: elapsedTime,
            maxSpeed: maxSpeed,
            totalAscent: totalAscent.toFixed(0),
            totalDescent: totalDescent.toFixed(0)
          };
          storeDataForOfflineSync(trackData);
        }
      },
      (err) => {
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
        toast.error(errorMessage);
      },
      POSITION_OPTIONS
    );
    setWatchId(id);
    toast.success('GPS tracking started!');
  }, [paused, positions, lastUpdateTime, maxSpeed, lastElevation, stopTracking, isStationary, stationaryStartTime, positionHistory]);

  const pauseTracking = useCallback(() => {
    setPaused(true);
    setLastPauseTime(Date.now());
    toast.info('Tracking paused');
  }, []);

  const resumeTracking = useCallback(() => {
    if (lastPauseTime) {
      setPauseDuration((prev) => prev + (Date.now() - lastPauseTime));
    }
    setLastPauseTime(null);
    setPaused(false);
    toast.success('Tracking resumed');
  }, [lastPauseTime]);

  const resetTracking = useCallback(() => {
    clearAllData();
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
        toast.error(`Couldn't get location: ${err.message}`);
        setLoading(false);
      });
  }, [isOffline]);

  const toggleMapType = useCallback(() => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
    toast.info(`Switched to ${mapType === 'standard' ? 'satellite' : 'standard'} map`);
  }, [mapType]);

  const handleFinish = useCallback(async () => {
    if (positions.length <= 1) {
      toast.error('Not enough tracking data to save');
      return;
    }
    
    setIsSaving(true);
    const { distance, avgSpeed } = calculations();
    let imageData: string | null = mapImage;
    
    if (!imageData) {
      const capturedImage = await captureMapImage();
      if (!capturedImage) {
        setIsSaving(false);
        return;
      }
      imageData = capturedImage;
    }

    const trackData: TrackData = {
      season: new Date().getFullYear(),
      image: imageData,
      distance: distance(),
      elapsedTime: elapsedTime,
      averageSpeed: avgSpeed(),
      fullName: username || 'Unknown User',
      maxSpeed: maxSpeed.toFixed(1),
      totalAscent: totalAscent.toFixed(0),
      totalDescent: totalDescent.toFixed(0),
      timestamp: Date.now(),
      positions: positions.map(p => [p.lat, p.lng] as [number, number])
    };

    try {
      if (isOffline) {
        await storeDataForOfflineSync(trackData as unknown as OfflineData);
        toast.success('Track saved offline. It will be uploaded when you reconnect.');
        setSaveSuccess(true);
      } else {
        const response = await fetch('/api/saveTrack', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(trackData)
        });
        
        if (response.ok) {
          toast.success('Track saved successfully!');
          setSaveSuccess(true);
        } else {
          toast.error('Failed to save track data');
          setSaveSuccess(false);
        }
      }
    } catch (error) {
      console.error('Error saving track:', error);
      
      if (!isOffline) {
        await storeDataForOfflineSync(trackData as unknown as OfflineData);
        toast.warning('Network error. Track saved offline for later upload.');
        setSaveSuccess(true);
      } else {
        toast.error('Failed to save track data');
        setSaveSuccess(false);
      }
    } finally {
      setIsSaving(false);
    }
  }, [positions, username, mapImage, elapsedTime, captureMapImage, maxSpeed, totalAscent, totalDescent, calculations, isOffline]);

  return (
    <div className={`relative bg-gray-100 w-full md:w-[400px] h-screen mx-auto rounded-none md:rounded-[40px] overflow-hidden shadow-2xl ${className}`}>
      {/* iPhone notch simulation - only show on larger screens */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-black rounded-b-[20px] z-50 hidden md:block" />
      
      <div className="absolute inset-0">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="animate-spin text-gray-800 h-9 w-9" />
              <p className="text-lg font-medium text-gray-800">Loading map...</p>
            </div>
          </div>
        )}

        <MapComponent
          mapCenter={mapCenter}
          positions={positions.map(p => [p.lat, p.lng])}
          mapType={mapType}
          recenterTrigger={recenterTrigger}
          mapContainerRef={mapContainerRef}
          loading={loading}
          className="w-full h-full"
        />

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <Drawer defaultOpen modal={false}>
            <DrawerTrigger asChild>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm flex items-center justify-between px-4 cursor-pointer transition-all duration-300 hover:bg-white group">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">{calculateDistance()} km</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                    <Clock className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-full">
                    <Gauge className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">{speed.toFixed(1)} km/h</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <ChevronUp className="h-5 w-5 text-gray-500 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </DrawerTrigger>
            <DrawerPortal>
              <DrawerOverlay className="bg-black/50 transition-opacity duration-300" />
              <DrawerContent className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:w-[400px] h-[60vh] rounded-t-[40px] border-0 transition-transform duration-300 ease-out">
                <DrawerHeader className="px-6">
                  <DrawerTitle className="text-xl font-semibold">Tracking Controls</DrawerTitle>
                </DrawerHeader>
                <div className="p-6 space-y-6 overflow-y-auto">
                  <StatsComponent
                    distance={calculateDistance()}
                    elapsedTime={elapsedTime}
                    speed={speed}
                    className="mb-4"
                  />

                  <ControlsComponent
                    tracking={tracking}
                    paused={paused}
                    isOffline={isOffline}
                    loading={loading}
                    onStartTracking={startTracking}
                    onStopTracking={stopTracking}
                    onPauseTracking={pauseTracking}
                    onResumeTracking={resumeTracking}
                    onRecenterMap={recenterMap}
                    onToggleMapType={toggleMapType}
                    onResetTracking={resetTracking}
                    className="flex flex-col space-y-4"
                  />
                </div>
              </DrawerContent>
            </DrawerPortal>
          </Drawer>
        </div>

        <ResultsModal
          showResults={showResults}
          mapImage={mapImage}
          distance={calculateDistance()}
          elapsedTime={elapsedTime}
          avgSpeed={calculateAverageSpeed()}
          maxSpeed={maxSpeed}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          onClose={() => setShowResults(false)}
          onFinish={handleFinish}
          onReset={resetTracking}
          className="bg-white rounded-lg shadow-xl"
        />
      </div>

      {/* Development Console Button */}
      <Dialog open={showConsole} onOpenChange={setShowConsole}>
        <DialogTrigger asChild>
          <Button
            className="absolute top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full"
            onClick={() => setShowConsole(true)}
          >
            <Terminal className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Tracking Console</DialogTitle>
          </DialogHeader>
          <div className="mt-4 h-[60vh] overflow-y-auto bg-black text-green-400 font-mono p-4 rounded-lg">
            {consoleLog.map((log, index) => (
              <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : ''}`}>
                [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GpsTracker;
