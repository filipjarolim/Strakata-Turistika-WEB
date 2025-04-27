'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Pause, PlayCircle, RefreshCcw, Target, DownloadCloud, Map, Award, Loader2, Activity, Menu, Clock, Gauge, ChevronUp, FileText } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import { GPSTrackerProps, Calculations, OfflineData, TrackData, LogEntry } from './gps-tracker/types';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
const STATIONARY_THRESHOLD_KM = 0.002; // Reduced from 0.005 to 2 meters
const STATIONARY_TIME_THRESHOLD = 10000; // 10 seconds
const SPEED_FILTER_THRESHOLD = 0.5; // Consider speeds below 0.5 km/h as stationary
const POSITION_HISTORY_SIZE = 20; // Increased from 10 to 20 positions
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

const GpsTracker: React.FC<GPSTrackerProps> = ({ username, className = '' }) => {
  // Tracking states
  const [tracking, setTracking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [positions, setPositions] = useState<[number, number][]>([]);
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

  // Add state for logging and progressive distance
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentTotalDistance, setCurrentTotalDistance] = useState<number>(0);

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
    // Reset new state variables
    setLogEntries([]);
    setCurrentTotalDistance(0);
    setIsStationary(false);
    setStationaryStartTime(null);
    setLastValidPosition(null);
    setPositionHistory([]);
    setLastStoredPosition(null);
    setLastStoredTime(null);
  }, []);

  // Recalculate total distance from positions array (useful after loading offline data)
  const recalculateTotalDistance = (currentPositions: [number, number][]) => {
    let total = 0;
    for (let i = 1; i < currentPositions.length; i++) {
      total += haversineDistance(
        currentPositions[i - 1][0],
        currentPositions[i - 1][1],
        currentPositions[i][0],
        currentPositions[i][1]
      );
    }
    return total;
  };

  // Modified calculations to use currentTotalDistance state
  const calculations = useCallback((): Calculations => {
    const distance = (): string => {
      return currentTotalDistance.toFixed(2);
    };

    const avgSpeed = (): string => {
      if (elapsedTime === 0 || positions.length <= 1) return '0.0';
      const avg = (currentTotalDistance * 3600) / elapsedTime;
      return avg.toFixed(1);
    };

    return { 
      distance, 
      avgSpeed,
      maxSpeed,
      totalAscent,
      totalDescent
    };
  }, [currentTotalDistance, elapsedTime, positions.length, maxSpeed, totalAscent, totalDescent]); // Added dependencies

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

  // Effect to load stored data on mount
  useEffect(() => {
    const handleOfflineTracks = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tracks) {
        const offlineTracks: OfflineData[] = customEvent.detail.tracks;
        console.log('Loaded offline tracks:', offlineTracks);

        const loadedPositions: [number, number][] = [];
        let cumulativeDistance = 0;
        const loadedLogs: LogEntry[] = [];

        offlineTracks.forEach((track, index) => {
          if (track.positions) {
            track.positions.forEach((pos, posIndex) => {
              const newPositionTuple: [number, number] = [pos[0], pos[1]];
              let segmentDistance = 0;
              if (loadedPositions.length > 0) {
                segmentDistance = haversineDistance(
                  loadedPositions[loadedPositions.length - 1][0],
                  loadedPositions[loadedPositions.length - 1][1],
                  newPositionTuple[0],
                  newPositionTuple[1]
                );
              }
              cumulativeDistance += segmentDistance;
              loadedPositions.push(newPositionTuple);
              loadedLogs.push({
                timestamp: track.timestamp ? Number(track.timestamp) : Date.now(),
                lat: newPositionTuple[0],
                lon: newPositionTuple[1],
                accuracy: 0, // Accuracy not stored in offline data currently
                distance: cumulativeDistance,
                source: 'offline'
              });
            });
          }
        });

        // Merge with potentially existing live data if tracking was already started?
        // For now, assume this runs before live tracking starts or replaces it.
        if (loadedPositions.length > 0) {
          setPositions(loadedPositions);
          setCurrentTotalDistance(cumulativeDistance);
          setLogEntries(prevLogs => [...loadedLogs, ...prevLogs]); // Prepend offline logs
          setMapCenter(loadedPositions[loadedPositions.length - 1]);
          toast.info(`Loaded ${loadedPositions.length} positions from offline storage.`);
        }
      }
    };

    window.addEventListener('indexeddb-tracks-found', handleOfflineTracks);

    // Initial location check (slightly modified)
    setLoading(true);
    getStoredLocation(); // Trigger IndexedDB check

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
            // Rely on IndexedDB check via getStoredLocation()
            toast.warning('You are offline. Checking for cached location data...');
            setLoading(false); // Assume loading finishes after check starts
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
              // Set initial map center only if no positions were loaded from offline
              if (positions.length === 0) {
                 setMapCenter(loc);
              }
              localStorage.setItem('lastKnownLocation', JSON.stringify(loc));
              saveLocationForOffline(loc); // Save initial location too
              setLoading(false);
        } catch (error) {
          console.error('Permission check error:', error);
          setLoading(false);
          
          // Rely on IndexedDB check via getStoredLocation()
          if (positions.length === 0) { // Only show error if no offline data found
            toast.error('Could not get your location. Please check your GPS signal and try again.');
            const defaultLocation: [number, number] = [50.0755, 14.4378];
            setMapCenter(defaultLocation);
          }
        }
      };
      
      checkPermission();
    
    return () => {
      // Removed watchId clear here as it belongs to startTracking
      window.removeEventListener('indexeddb-tracks-found', handleOfflineTracks);
    };
  }, [positions.length]); // Dependency ensures map center logic runs correctly after potential offline load

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
      // Log final point
      if (lastValidPosition) {
         const finalLog: LogEntry = {
            timestamp: Date.now(),
            lat: lastValidPosition[0],
            lon: lastValidPosition[1],
            accuracy: 0, // Accuracy might not be available here
            distance: currentTotalDistance,
            source: 'stop'
         }
         setLogEntries(prev => [...prev, finalLog]);
      }
      setShowResults(true);
      captureMapImage();
    } else {
      toast.warning('No track data to save.');
    }
  }, [watchId, positions.length, captureMapImage, lastValidPosition, currentTotalDistance]); // Added dependencies

  // Changed startTracking back to useCallback as it's triggered by user action
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    clearAllData(); 

    setTracking(true);
    setCompleted(false);
    setShowResults(false);
    setMapImage(null);
    setStartTime(Date.now());
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window && !backgroundSyncRegistered) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.sync) {
          registration.sync.register('gps-tracking').then(() => {
            setBackgroundSyncRegistered(true);
          }).catch(err => {
            console.error('Background sync registration failed:', err);
          });
        } else {
           console.warn('Background Sync not supported by this browser/registration.');
        }
      });
    }
    
    const positionCallback = (pos: GeolocationPosition) => {
        if (paused) return;
        
        const accuracy = pos.coords.accuracy || 0;
        if (accuracy > MIN_ACCURACY * 2) { // Check accuracy early
          toast.warning(`Low GPS accuracy: ${accuracy.toFixed(1)}m. Try moving to a more open area.`);
          return;
        }

        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const currentTime = Date.now();
        
        // Update position history
        setPositionHistory(prev => {
          const updated = [...prev, { pos: newPos, time: currentTime }];
          return updated.slice(-POSITION_HISTORY_SIZE);
        });
        
        // Check if we're stationary with improved detection
        let currentlyStationary = false;
        if (positionHistory.length >= POSITION_HISTORY_SIZE / 2) { // Require a few points before check
          const avgDistance = positionHistory.reduce((sum, { pos: historyPos }) => {
            return sum + haversineDistance(historyPos[0], historyPos[1], newPos[0], newPos[1]);
          }, 0) / positionHistory.length;
          
          const allPositionsStationary = positionHistory.every(({ pos: historyPos }) => 
            haversineDistance(historyPos[0], historyPos[1], newPos[0], newPos[1]) < STATIONARY_THRESHOLD_KM
          );
          
          currentlyStationary = avgDistance < STATIONARY_THRESHOLD_KM && allPositionsStationary;
        }

        if (currentlyStationary) {
          if (!isStationary) {
             setIsStationary(true);
             setStationaryStartTime(currentTime);
          }
        } else {
          if (isStationary) { // Reset only if state changes
             setIsStationary(false);
             setStationaryStartTime(null);
          }
        }
        
        let segmentDistance = 0;
        let isNewPositionAdded = false;

        // Only update position if we're moving or if we've been stationary for a while
        const shouldUpdatePosition = !currentlyStationary || (stationaryStartTime && currentTime - stationaryStartTime > STATIONARY_TIME_THRESHOLD);

        if (shouldUpdatePosition) {
          setPositions((prev) => {
            let shouldAdd = true;
            if (prev.length > 0) {
              const [lastLat, lastLon] = prev[prev.length - 1];
              segmentDistance = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]); // Calculate potential distance
              if (segmentDistance < MIN_DISTANCE_KM && lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL) {
                shouldAdd = false;
              }
            } else {
              segmentDistance = 0; // First point
            }

            if(shouldAdd) {
              setLastUpdateTime(currentTime);
              setMapCenter(newPos);
              setLastValidPosition(newPos);
              isNewPositionAdded = true;
              return [...prev, newPos];
            } else {
              // Reset segment distance if not added
              segmentDistance = 0;
              return prev;
            }
          });
        }

        // Update total distance only if a new position was actually added and not stationary
        if (isNewPositionAdded && !currentlyStationary) {
           setCurrentTotalDistance(prevDist => prevDist + segmentDistance);
        }
        
        // --- Speed Calculation --- 
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
                if (currentlyStationary || speedValue < SPEED_FILTER_THRESHOLD) {
                  speedValue = 0;
                }
            } else {
                 speedValue = 0; 
            }
            } else if (speedValue !== null) {
              speedValue *= 3.6;
              if (currentlyStationary || speedValue < SPEED_FILTER_THRESHOLD) {
                  speedValue = 0;
              }
            } else {
              speedValue = 0; 
            }

        // Set Speed State using the calculated speedValue
        setSpeed(prev => {
          const alpha = 0.2; 
          const newSpeed = speedValue * alpha + prev * (1 - alpha);
          // Use currentlyStationary for immediate zeroing
          if (currentlyStationary || newSpeed < SPEED_FILTER_THRESHOLD) {
            return 0;
          }
          return newSpeed;
        });

        // Update Max Speed
        if (speedValue > maxSpeed && !currentlyStationary) {
          setMaxSpeed(speedValue);
        }

        // Add Log Entry if position was added
        if (isNewPositionAdded) {
          const logEntry: LogEntry = {
             timestamp: currentTime,
             lat: newPos[0],
             lon: newPos[1],
             accuracy: accuracy,
             distance: currentTotalDistance, // Log the distance *after* potential update
             source: 'live'
          }
          setLogEntries(prev => [...prev, logEntry]);
        }
        
        // --- Elevation Calculation --- (Assuming this logic is correct)
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
        
        // --- Store Offline Logic --- (Using lastValidPosition)
        if (lastValidPosition && (lastStoredPosition === null || 
            haversineDistance(lastStoredPosition[0], lastStoredPosition[1], lastValidPosition[0], lastValidPosition[1]) > MIN_DISTANCE_KM ||
            currentTime - (lastStoredTime || 0) > 30000)) { 
          setLastStoredPosition(lastValidPosition);
          setLastStoredTime(currentTime);
          saveLocationForOffline(lastValidPosition);
          
          const trackData: OfflineData = {
            positions: [lastValidPosition],
            timestamp: currentTime,
          };
          storeDataForOfflineSync(trackData);
        }
      };

      const errorCallback = (err: GeolocationPositionError) => {
        console.error('Error watching position:', err);
        let errorMessage = 'Location error: ';
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage += 'Permission denied. Please enable location services.';
            // Attempt to stop tracking gracefully
            if (watchId) navigator.geolocation.clearWatch(watchId);
            setTracking(false);
            setWatchId(null);
            setCompleted(true); // Mark as completed due to error
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage += 'Position unavailable. Check your GPS signal.';
            break;
          case 3: // TIMEOUT
            errorMessage += 'Position request timed out. Try again.';
            break;
          default:
            errorMessage += err.message;
        }
        toast.error(errorMessage);
      };

    // Correct watchPosition call
    const watchOptions = POSITION_OPTIONS;
    const id = navigator.geolocation.watchPosition(positionCallback, errorCallback, watchOptions);
    setWatchId(id);
    toast.success('GPS tracking started!');

  }, [
    // List all dependencies for useCallback
    paused, 
    lastUpdateTime, 
    maxSpeed, 
    lastElevation, 
    isStationary,
    stationaryStartTime, 
    positionHistory, 
    backgroundSyncRegistered, 
    clearAllData, 
    currentTotalDistance,
    lastValidPosition,
    lastStoredPosition,
    lastStoredTime,
    watchId,
  ]); 

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
      elapsedTime,
      averageSpeed: avgSpeed(),
      fullName: username || 'Unknown User',
      maxSpeed: maxSpeed.toFixed(1),
      totalAscent: totalAscent.toFixed(0),
      totalDescent: totalDescent.toFixed(0),
      timestamp: Date.now(),
      positions: positions
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
    <div className={`relative bg-gray-100 w-full md:w-[400px]  h-screen mx-auto rounded-none md:rounded-[40px] overflow-hidden shadow-2xl ${className}`}>
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
          positions={positions}
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
                <DrawerHeader className="px-6 flex justify-between items-center">
                  <DrawerTitle className="text-xl font-semibold">Tracking Controls</DrawerTitle>
                   {/* Add Dialog Trigger for Logs */}
                   <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                           <FileText className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[90vw] md:max-w-[400px] h-[70vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>GPS Log</DialogTitle>
                          <DialogDescription>
                            Detailed log of recorded GPS positions.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-grow overflow-y-auto text-xs space-y-1 pr-2">
                          {logEntries.length === 0 ? (
                             <p className="text-gray-500 text-center mt-4">No log entries yet.</p>
                           ) : (
                             logEntries.map((entry, index) => (
                               <div key={index} className={`p-1.5 rounded ${entry.source === 'offline' ? 'bg-blue-50' : entry.source === 'stop' ? 'bg-red-50' : 'bg-green-50'}`}>
                                 <span className="font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</span> - 
                                 <span className="font-semibold">Dist:</span> {entry.distance.toFixed(3)}km - 
                                 <span className="text-gray-600">Acc: {entry.accuracy.toFixed(0)}m - </span>
                                 <span className="text-gray-600">Src: {entry.source}</span> <br/>
                                 <span className="text-gray-500">Lat: {entry.lat.toFixed(5)}, Lon: {entry.lon.toFixed(5)}</span>
                               </div>
                             ))
                           )}
                        </div>
                      </DialogContent>
                    </Dialog>
                </DrawerHeader>
                <div className="p-6 pt-2 space-y-6 overflow-y-auto">
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
    </div>
  );
};

export default GpsTracker;
