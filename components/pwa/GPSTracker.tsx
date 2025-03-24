'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Pause, PlayCircle, RefreshCcw, Target, DownloadCloud, Map, Award, Loader2, Compass, Clock, Activity, Ruler, Share2, BatteryMedium, Wifi, Settings, AlertTriangle } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ShareButton from './ShareButton';

// A dedicated component that re-centers the map when trigger changes.
const RecenterMapComponent: React.FC<{
  trigger: number;
  center: [number, number] | null;
  zoom: number;
}> = ({ trigger, center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [trigger, center, zoom, map]);
  return null;
};

const MapContainerWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayerWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const PolylineWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const MarkerWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const PopupWrapper = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Constants & configurations
const ZOOM_LEVEL = 16;
const MIN_DISTANCE_KM = 0.002;
const MIN_UPDATE_INTERVAL = 1000;
const MIN_ACCURACY = 35;
const POSITION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
};
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_LAYER_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

// Marker Icon Configuration
const currentPositionIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjEyMCIgZmlsbD0icmdiYSgwLCAxMjIsIDI1NSwgMC44KSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI4Ii8+PGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSI2MCIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSIyNTYiIGN5PSIyNTYiIHI9IjMwIiBmaWxsPSIjMDA3YWZmIi8+PC9zdmc+',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'animate-pulse custom-marker',
});

const startPositionIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgNTEyIj48cGF0aCBmaWxsPSIjNGFkZTgwIiBkPSJNMTkyIDk2YzE3LjcgMCAzMi0xNC4zIDMyLTMycy0xNC4zLTMyLTMyLTMyLTMyIDE0LjMtMzIgMzIgMTQuMyAzMiAzMiAzMnptMCA2NCAzMi0zMiA2NCA2NHY4NmMwIDE0LTktMjMtMjAtMzRsLTQ0LTQ0djI2MmMwIDE0LTkgMjYtMjAgMzRsLTUyLTUyaC0zMEwxMTIgNTAwYy0xMS4xLTcuOC0yMC01MC0yMC02NHYtODZsNjQtNjQgMzYgMzZ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOTIgNDE0aDMydjMySDE5MnYtMzJ6Ii8+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMTQgMjI1YzQuMSAwIDcuOCAyLjYgOS4zIDYuNWwxNS44IDQwLjljLjUgMS4zLjggMi42LjggNGwuMiAzMy44YzAgOC44LTcuMiAxNi0xNiAxNmgtMzJjLTguOCAwLTE2LTcuMi0xNi0xNmwtLjItMzMuOGMwLTEuNC4zLTIuNy43LTRsMTUuOC00MC45YzEuNS0zLjkgNS4yLTYuNSA5LjMtNi41aDE4LjR6Ii8+PC9zdmc+',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// Haversine formula for distance calculation
const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getStoredLocation = () => {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem('lastKnownLocation');
  return saved ? JSON.parse(saved) : null;
};

interface GPSTrackerProps {
  username: string;
}

const GpsTracker: React.FC<GPSTrackerProps> = ({ username }) => {
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
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Add elevations state
  const [elevations, setElevations] = useState<number[]>([]);

  const calculations = useCallback(() => {
    const distance = (): string => {
      let total = 0;
      for (let i = 1; i < positions.length; i++) {
        total += haversineDistance(
          positions[i - 1][0],
          positions[i - 1][1],
          positions[i][0],
          positions[i][1]
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

    return { distance, avgSpeed };
  }, [positions, elapsedTime]);

  // Update UI when location access status changes
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
          }
          setLoading(false);
          return;
        }
        
        setIsOffline(false);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setMapCenter(loc);
            localStorage.setItem('lastKnownLocation', JSON.stringify(loc));
            setLoading(false);
          },
          (err) => {
            console.error('Error retrieving position:', err);
            toast.error(`Location error: ${err.message}`);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } catch (error) {
        console.error('Permission check error:', error);
        setLoading(false);
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
  }, [tracking, elapsedTime, paused, isOffline]);

  const startTracking = useCallback(() => {
    if (isOffline) {
      toast.error('Cannot start tracking while offline.');
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
    
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error('Full screen error:', err);
          toast.warning('Could not enter fullscreen mode.');
        });
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (paused) return;
        
        // Check position accuracy - only warn for very low accuracy
        if (pos.coords.accuracy > MIN_ACCURACY * 2) {
          toast.warning(`Low GPS accuracy: ${pos.coords.accuracy.toFixed(1)}m. Try moving to a more open area.`);
          return;
        }

        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const currentTime = Date.now();
        
        // Update elevation data if available
        if (pos.coords.altitude !== null) {
          const currentElevation = pos.coords.altitude;
          setElevation(currentElevation);
          setElevations(prev => [...prev, currentElevation]);
          
          // Track ascent/descent with accuracy check
          if (lastElevation !== null && pos.coords.altitudeAccuracy && pos.coords.altitudeAccuracy < 10) {
            const elevationDiff = currentElevation - lastElevation;
            if (elevationDiff > 0.5) { // More sensitive elevation tracking
              setTotalAscent(prev => prev + elevationDiff);
            } else if (elevationDiff < -0.5) {
              setTotalDescent(prev => prev + Math.abs(elevationDiff));
            }
          }
          setLastElevation(currentElevation);
        } else {
          // If no altitude data available, use a placeholder for consistent array sizes
          setElevations(prev => [...prev, prev.length > 0 ? prev[prev.length - 1] : 0]);
        }
        
        // Enhanced speed calculation
        let computedSpeed = pos.coords.speed;
        if (computedSpeed === null && positions.length > 0 && lastUpdateTime) {
          const [lastLat, lastLon] = positions[positions.length - 1];
          const timeDiff = (currentTime - lastUpdateTime) / 1000; // Convert to seconds
          if (timeDiff > 0) {
            computedSpeed = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]) / timeDiff * 3600;
          }
        } else if (computedSpeed !== null) {
          computedSpeed *= 3.6; // Convert m/s to km/h
        }
        
        if (computedSpeed !== null && computedSpeed >= 0) {
          // Apply smoothing to speed
          setSpeed(prev => computedSpeed * 0.3 + prev * 0.7); // Weighted average
          if (computedSpeed > maxSpeed) {
            setMaxSpeed(computedSpeed);
          }
        }
        
        setPositions((prev) => {
          if (prev.length > 0) {
            const [lastLat, lastLon] = prev[prev.length - 1];
            const dist = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]);
            // Only update if we've moved enough or enough time has passed
            if (dist < MIN_DISTANCE_KM && lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL) {
              return prev;
            }
          }
          setLastUpdateTime(currentTime);
          setMapCenter(newPos);
          return [...prev, newPos];
        });
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
  }, [paused, positions, lastUpdateTime, maxSpeed, isOffline, lastElevation, totalAscent, totalDescent]);

  const stopTracking = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
    setWatchId(null);
    setCompleted(true);
    
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Exit full screen error:', err));
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
    
    if (positions.length > 1) {
      setShowResults(true);
      captureMapImage();
    } else {
      toast.warning('No track data to save. Try again with a longer route.');
    }
  }, [watchId, positions.length]);

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
    toast.info('Tracking reset');
  }, []);

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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(loc);
        setRecenterTrigger((prev) => prev + 1);
        
        // Save location data for offline use
        localStorage.setItem('lastKnownLocation', JSON.stringify(loc));
        
        setLoading(false);
      },
      (err) => {
        console.error('Error recentering map:', err);
        toast.error(`Couldn't get location: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [isOffline]);

  // Capture the map as a PNG image
  const captureMapImage = useCallback(async () => {
    if (!mapContainerRef.current) return;
    try {
      const canvas = await html2canvas(mapContainerRef.current, { useCORS: true });
      const imageData = canvas.toDataURL('image/png');
      setMapImage(imageData);
      return imageData;
    } catch (error) {
      console.error('Error capturing map image:', error);
      toast.error('Failed to capture route image');
      return null;
    }
  }, []);

  // Declare functions first
  function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return hours > 0 
      ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
      : `${pad(minutes)}:${pad(remainingSeconds)}`;
  }

  const { distance: calculateDistance, avgSpeed: calculateAverageSpeed } = calculations();

  // Add interface for track data for offline sync
  interface TrackData {
    season: number;
    image: string | null;
    distance: string;
    elapsedTime: number;
    averageSpeed: string;
    fullName: string;
    maxSpeed: string;
    totalAscent: string;
    totalDescent: string;
    timestamp: number;
    positions: [number, number][];
  }

  // Types for gradient path segments
  interface PathSegment {
    positions: [number, number][];
    color: string;
    weight: number;
    opacity: number;
  }

  // Add function to create gradient path
  const createGradientPath = (
    positions: [number, number][],
    elevations: number[]
  ): PathSegment | PathSegment[] => {
    // Default to blue line if no elevation data
    if (!elevations || elevations.length < positions.length) {
      return {
        positions,
        color: '#007aff',
        weight: 5,
        opacity: 0.8
      };
    }
    
    // Create segments with color based on elevation change
    const segments: PathSegment[] = [];
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);
    let range = maxElevation - minElevation;
    
    if (range === 0) range = 1; // Avoid division by zero
    
    for (let i = 1; i < positions.length; i++) {
      const elev = elevations[i];
      const normalizedElevation = (elev - minElevation) / range;
      
      // Create color gradient: green for low, yellow for mid, red for high elevations
      let color;
      if (normalizedElevation < 0.33) {
        color = '#4caf50'; // Green for lower elevations
      } else if (normalizedElevation < 0.66) {
        color = '#ff9800'; // Orange for middle elevations
      } else {
        color = '#f44336'; // Red for higher elevations
      }
      
      segments.push({
        positions: [positions[i-1], positions[i]],
        color,
        weight: 5,
        opacity: 0.8
      });
    }
    
    return segments;
  };

  // Toggle map type between standard and satellite
  const toggleMapType = useCallback(() => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
    toast.info(`Switched to ${mapType === 'standard' ? 'satellite' : 'standard'} map`);
  }, [mapType]);

  // Download track image
  const downloadTrackImage = useCallback(() => {
    if (!mapImage) return;
    
    const link = document.createElement('a');
    link.href = mapImage;
    link.download = `gps-track-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Track image downloaded');
  }, [mapImage]);

  // Save the tracking data to the API
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
      timestamp: Date.now(), // Add timestamp for syncing
      positions: positions // Include position data for offline use
    };

    try {
      if (isOffline) {
        // Store data locally and register for background sync
        await storeDataForOfflineSync(trackData);
        
        // Update UI to show pending sync
        toast.success('Track saved offline. It will be uploaded when you reconnect.');
        setSaveSuccess(true);
      } else {
        // Online - direct API submission
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
      
      // Attempt to save locally if online submission failed
      if (!isOffline) {
        await storeDataForOfflineSync(trackData);
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

  // Function to store tracking data for offline sync
  const storeDataForOfflineSync = async (trackData: TrackData): Promise<boolean> => {
    // Store the data in cache storage via the service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      // Save pending track data
      navigator.serviceWorker.controller.postMessage({
        type: 'SAVE_FOR_OFFLINE',
        url: '/pending-gps-data',
        data: trackData
      });
      
      // Register for background sync if supported
      if ('sync' in navigator.serviceWorker) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('sync-gps-data');
        } catch (err) {
          console.error('Background sync registration failed:', err);
        }
      }
      
      return true;
    } else {
      // Fallback to localStorage if service worker is not available
      try {
        const pendingData = JSON.parse(localStorage.getItem('pendingGpsData') || '[]');
        pendingData.push(trackData);
        localStorage.setItem('pendingGpsData', JSON.stringify(pendingData));
        return true;
      } catch (err) {
        console.error('Error storing data locally:', err);
        return false;
      }
    }
  };

  // Add offline caching support for GPS tracking data
  useEffect(() => {
    // Register listener for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent): void => {
      if (event.data && event.data.type === "SYNC_COMPLETED") {
        if (event.data.success) {
          toast.success("Your GPS data was synced successfully!");
        }
      }
      
      if (event.data && event.data.type === "UPDATE_CACHED_PAGES") {
        // Update UI to reflect available offline pages
        console.log("Available offline pages updated", event.data.pages);
      }
    };
    
    // Add event listener for service worker messages
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);
    
    // Remove event listener on cleanup
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Function to save location data for offline use
  const saveLocationForOffline = useCallback((locationData: [number, number]): void => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SAVE_FOR_OFFLINE',
        url: '/lastKnownLocation',
        data: {
          lat: locationData[0],
          lng: locationData[1],
          timestamp: Date.now()
        }
      });
    }
  }, []);

  // Add to the top of the component to check for network status changes
  useEffect(() => {
    // Handler for online status changes
    const handleOnlineStatusChange = () => {
      const isOnline = navigator.onLine;
      setIsOffline(!isOnline);
      
      if (isOnline) {
        toast.success('You are back online!');
        
        // Try to sync pending data when back online
        if (navigator.serviceWorker && 'sync' in navigator.serviceWorker) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-gps-data').catch(err => {
              console.error('Sync registration failed:', err);
            });
          });
        }
      } else {
        toast.warning('You are now offline. GPS tracking will continue to work.');
      }
    };
    
    // Set initial offline state
    setIsOffline(!navigator.onLine);
    
    // Add event listeners for online/offline status changes
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Add before the return statement
  const mobileCss = `
    @media (max-width: 640px) {
      .mobile-control-panel {
        width: 100% !important;
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: auto !important;
        transform: none !important;
        border-radius: 12px 12px 0 0 !important;
        z-index: 30 !important;
      }
      
      .mobile-control-content {
        flex-direction: row !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 8px !important;
      }
      
      .mobile-bottom-safe {
        margin-bottom: 80px !important;
      }
      
      .mobile-header {
        padding: 8px 12px !important;
      }
      
      .mobile-small-text {
        font-size: 0.75rem !important;
      }
      
      .mobile-xs-text {
        font-size: 0.7rem !important;
      }
    }
    
    .animate-dash {
      animation: dash 1.5s linear infinite;
      stroke-dasharray: 10, 10;
      stroke-dashoffset: 0;
    }
    
    @keyframes dash {
      to {
        stroke-dashoffset: 20;
      }
    }
    
    .custom-marker {
      filter: drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.3));
      transition: all 0.3s ease-out;
    }
    
    .leaflet-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    .leaflet-popup-content {
      margin: 10px 14px;
      line-height: 1.5;
    }
    
    .leaflet-popup-tip {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
    }
    
    .stat-icon {
      opacity: 0.7;
    }
    
    .pulse-ring {
      border-radius: 50%;
      height: 45px;
      width: 45px;
      position: absolute;
      animation: pulse 1.5s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
    }
    
    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        opacity: 0.3;
      }
      100% {
        transform: scale(1.4);
        opacity: 0;
      }
    }
    
    .tracking-pulse-dot::before {
      content: '';
      display: block;
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: #22c55e;
      top: 6px;
      left: 6px;
    }
    
    .tracking-pulse-dot::after {
      content: '';
      display: block;
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: rgba(34, 197, 94, 0.4);
      animation: pulse 2s infinite;
    }
    
    .map-attribution {
      background-color: rgba(255, 255, 255, 0.7) !important;
      border-radius: 4px !important;
      padding: 2px 5px !important;
      font-size: 11px !important;
    }
  `;

  return (
    <>
      <style jsx global>{mobileCss}</style>
      <div 
        className="relative rounded-lg shadow-lg overflow-hidden border border-gray-200 bg-gray-50" 
        style={{ width: '100%', height: '85vh', maxHeight: 'calc(100vh - 100px)' }}
        aria-label="GPS Trail Tracker"
        role="application"
      >
        {/* Status Bar */}
        <div className="absolute top-0 left-0 w-full p-1.5 flex justify-between items-center bg-gray-900 bg-opacity-90 backdrop-blur-sm z-20 mobile-header">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-200" />
            <span className="text-xs text-gray-200 mobile-xs-text">
              {tracking ? formatTime(elapsedTime) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <div className="flex items-center text-red-400 gap-1">
                <Wifi className="h-3.5 w-3.5" />
                <span className="text-xs mobile-xs-text">Offline</span>
              </div>
            ) : (
              <Wifi className="h-3.5 w-3.5 text-green-400" />
            )}
            <BatteryMedium className="h-3.5 w-3.5 text-gray-200" />
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" aria-live="polite" role="status">
            <div className="bg-white rounded-lg p-4 flex flex-col items-center space-y-2">
              <Loader2 className="animate-spin text-gray-800" size={36} aria-hidden="true" />
              <p className="text-gray-800 font-medium">Loading location...</p>
            </div>
          </div>
        )}
      
        {/* Map container with id and ref for screenshot */}
        <div id="mapContainer" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} aria-label="Interactive map displaying your route">
          {!loading && mapCenter && (
            <MapContainerWrapper
              center={mapCenter}
              zoom={ZOOM_LEVEL}
              style={{ width: '100%', height: '100%', zIndex: 1 }}
              attributionControl={false}
              zoomControl={false}
            >
              {mapType === 'standard' ? (
                <TileLayerWrapper 
                  attribution="&copy; OpenStreetMap contributors" 
                  url={TILE_LAYER_URL}
                  maxZoom={19}
                  minZoom={3}
                  keepBuffer={8}
                  className="map-tiles"
                />
              ) : (
                <TileLayerWrapper 
                  attribution={SATELLITE_ATTRIBUTION} 
                  url={SATELLITE_LAYER_URL}
                  maxZoom={19}
                  minZoom={3}
                  keepBuffer={8}
                  className="map-tiles"
                />
              )}
              
              {/* Start position marker */}
              {positions.length > 0 && (
                <MarkerWrapper 
                  position={positions[0]} 
                  icon={startPositionIcon}
                  zIndexOffset={1000}
                >
                  <PopupWrapper>
                    <div className="text-center">
                      <div className="font-bold text-green-600">Start Point</div>
                      <div className="text-sm text-gray-600">
                        {new Date(startTime || Date.now()).toLocaleTimeString()}
                      </div>
                    </div>
                  </PopupWrapper>
                </MarkerWrapper>
              )}
              
              {/* Current position marker */}
              {positions.length > 0 && (
                <MarkerWrapper 
                  position={positions[positions.length - 1]} 
                  icon={currentPositionIcon}
                  zIndexOffset={1000}
                >
                  <PopupWrapper>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">Current Position</div>
                      <div className="flex justify-between text-sm">
                        <span>Speed:</span> 
                        <span className="font-medium">{speed.toFixed(1)} km/h</span>
                      </div>
                      {elevation !== null && (
                        <div className="flex justify-between text-sm">
                          <span>Altitude:</span>
                          <span className="font-medium">{elevation.toFixed(0)}m</span>
                        </div>
                      )}
                    </div>
                  </PopupWrapper>
                </MarkerWrapper>
              )}
              
              {/* Track line with gradient color based on elevation */}
              {positions.length > 1 && elevations.length > 0 && (
                // Use multiple polylines for elevation-based gradient 
                <>
                  {/* First add a slightly wider background line for a nice effect */}
                  <PolylineWrapper
                    positions={positions}
                    color="#ffffff"
                    weight={7}
                    opacity={0.4}
                    lineCap="round"
                    lineJoin="round"
                  />
                  
                  {/* Then add the colored segments based on elevation */}
                  {(() => {
                    const gradientPath = createGradientPath(positions, elevations);
                    
                    if (Array.isArray(gradientPath)) {
                      // Render individual segments with their own colors
                      return gradientPath.map((segment, index) => (
                        <PolylineWrapper
                          key={index}
                          positions={segment.positions}
                          color={segment.color}
                          weight={segment.weight}
                          opacity={segment.opacity}
                          lineCap="round"
                          lineJoin="round"
                          dashArray={tracking && !paused ? "10,10" : ""}
                          className={tracking && !paused ? "animate-dash" : ""}
                        />
                      ));
                    } else {
                      // Render a single polyline
                      return (
                        <PolylineWrapper
                          positions={gradientPath.positions}
                          color={gradientPath.color}
                          weight={gradientPath.weight}
                          opacity={gradientPath.opacity}
                          lineCap="round"
                          lineJoin="round"
                          dashArray={tracking && !paused ? "10,10" : ""}
                          className={tracking && !paused ? "animate-dash" : ""}
                        />
                      );
                    }
                  })()}
                </>
              )}
              
              {/* Fallback for when there's no elevation data */}
              {positions.length > 1 && elevations.length === 0 && (
                <PolylineWrapper
                  positions={positions}
                  color="#007aff"
                  weight={5}
                  opacity={0.8}
                  lineCap="round"
                  lineJoin="round"
                  dashArray={tracking && !paused ? "10,10" : ""}
                  className={tracking && !paused ? "animate-dash" : ""}
                />
              )}
              
              <RecenterMapComponent trigger={recenterTrigger} center={mapCenter} zoom={ZOOM_LEVEL} />
            </MapContainerWrapper>
          )}
        </div>

        {/* Header Overlay */}
        <div className="absolute top-8 left-0 w-full px-3 py-2 flex justify-between items-center bg-gray-800 bg-opacity-80 backdrop-blur-sm z-10 mobile-header">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white">GPS Trail Tracker</h1>
            {isOffline ? (
              <Badge variant="destructive" className="text-xs">Offline</Badge>
            ) : tracking ? (
              paused ? (
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">Paused</Badge>
                </div>
              ) : (
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <div className="absolute w-6 h-6 bg-green-500 rounded-full opacity-25 animate-ping"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs ml-7">Live</Badge>
                </div>
              )
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-800 text-xs">Ready</Badge>
            )}
          </div>
          
          {/* Accessible battery saver toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 rounded-full" 
            onClick={() => toast.info("Battery saver mode toggled")}
            aria-label={`Toggle battery saver mode, currently off`}
          >
            <Settings className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Right-Side Controls Card - Desktop */}
        <Card className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10 bg-opacity-95 shadow-lg w-[120px] hidden sm:block">
          <CardContent className="p-3 flex flex-col gap-2">
            {!tracking ? (
              <Button 
                onClick={startTracking} 
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isOffline || loading}
                size="sm"
                aria-label="Start tracking"
              >
                <Play className="mr-1 h-4 w-4" /> Start
              </Button>
            ) : (
              <>
                {paused ? (
                  <Button 
                    onClick={resumeTracking} 
                    className="bg-green-600 text-white hover:bg-green-700" 
                    size="sm"
                    aria-label="Resume tracking"
                  >
                    <PlayCircle className="mr-1 h-4 w-4" /> Resume
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTracking} 
                    className="bg-yellow-600 text-white hover:bg-yellow-700" 
                    size="sm"
                    aria-label="Pause tracking"
                  >
                    <Pause className="mr-1 h-4 w-4" /> Pause
                  </Button>
                )}
                <Button 
                  onClick={stopTracking} 
                  className="bg-red-600 text-white hover:bg-red-700" 
                  size="sm"
                  aria-label="Stop tracking"
                >
                  <StopCircle className="mr-1 h-4 w-4" /> Stop
                </Button>
              </>
            )}
            
            <Button 
              onClick={recenterMap} 
              className="bg-gray-800 text-white hover:bg-gray-700" 
              size="sm"
              aria-label="Center map on current location"
            >
              <Target className="mr-1 h-4 w-4" /> Center
            </Button>
            
            <Button 
              onClick={toggleMapType} 
              className="bg-gray-800 text-white hover:bg-gray-700" 
              size="sm"
              aria-label={`Switch to ${mapType === 'standard' ? 'satellite' : 'standard'} map view`}
            >
              <Map className="mr-1 h-4 w-4" /> {mapType === 'standard' ? 'Satellite' : 'Standard'}
            </Button>
            
            <Button 
              onClick={resetTracking} 
              className="bg-gray-800 text-white hover:bg-gray-700" 
              size="sm" 
              disabled={tracking && !paused}
              aria-label="Reset tracking data"
            >
              <RefreshCcw className="mr-1 h-4 w-4" /> Reset
            </Button>
          </CardContent>
        </Card>

        {/* Mobile Control Panel */}
        <Card className="mobile-control-panel absolute top-1/2 right-3 transform -translate-y-1/2 z-30 bg-white shadow-lg w-[120px] block sm:hidden">
          <CardContent className="p-3 flex flex-col gap-2 mobile-control-content">
            {!tracking ? (
              <Button 
                onClick={startTracking} 
                className="bg-green-600 text-white hover:bg-green-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center"
                disabled={isOffline || loading}
                aria-label="Start tracking"
              >
                <Play className="h-6 w-6" />
              </Button>
            ) : (
              <>
                {paused ? (
                  <Button 
                    onClick={resumeTracking} 
                    className="bg-green-600 text-white hover:bg-green-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
                    aria-label="Resume tracking"
                  >
                    <PlayCircle className="h-6 w-6" />
                  </Button>
                ) : (
                  <Button 
                    onClick={pauseTracking} 
                    className="bg-yellow-600 text-white hover:bg-yellow-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
                    aria-label="Pause tracking"
                  >
                    <Pause className="h-6 w-6" />
                  </Button>
                )}
                <Button 
                  onClick={stopTracking} 
                  className="bg-red-600 text-white hover:bg-red-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
                  aria-label="Stop tracking"
                >
                  <StopCircle className="h-6 w-6" />
                </Button>
              </>
            )}
            
            <Button 
              onClick={recenterMap} 
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
              aria-label="Center map on current location"
            >
              <Target className="h-6 w-6" />
            </Button>
            
            <Button 
              onClick={toggleMapType} 
              className="bg-gray-800 text-white hover:bg-gray-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
              aria-label={`Switch to ${mapType === 'standard' ? 'satellite' : 'standard'} map view`}
            >
              <Map className="h-6 w-6" />
            </Button>
            
            {!tracking && (
              <Button 
                onClick={resetTracking} 
                className="bg-gray-800 text-white hover:bg-gray-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
                disabled={tracking && !paused}
                aria-label="Reset tracking data"
              >
                <RefreshCcw className="h-6 w-6" />
              </Button>
            )}
            
            {!tracking && (
              <div className="flex items-center justify-center w-[48px] h-[48px]">
                <ShareButton variant="mobile" />
              </div>
            )}
            
            {tracking && !paused && (
              <Button 
                onClick={() => toast.info("Sharing is not available yet")} 
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-full w-[48px] h-[48px] p-0 flex items-center justify-center" 
                aria-label="Share your current location"
              >
                <Share2 className="h-6 w-6" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Bottom Info Card */}
        <Card className="absolute bottom-0 left-0 right-0 m-3 bg-white bg-opacity-95 z-10 mobile-bottom-safe">
          <CardContent className="p-3">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="basic" aria-label="View basic tracking information">Basic</TabsTrigger>
                <TabsTrigger value="advanced" aria-label="View detailed tracking statistics">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-0">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Ruler className="h-3.5 w-3.5 text-gray-500 stat-icon" aria-hidden="true" />
                      <p className="text-xs text-gray-500 mobile-small-text">Distance</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800" aria-label={`Distance: ${calculateDistance()} kilometers`}>{calculateDistance()} km</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-500 stat-icon" aria-hidden="true" />
                      <p className="text-xs text-gray-500 mobile-small-text">Time</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800" aria-label={`Elapsed time: ${formatTime(elapsedTime)}`}>{formatTime(elapsedTime)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-gray-500 stat-icon" aria-hidden="true" />
                      <p className="text-xs text-gray-500 mobile-small-text">Speed</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800" aria-label={`Current speed: ${speed.toFixed(1)} kilometers per hour`}>{speed.toFixed(1)} km/h</p>
                  </div>
                </div>
                
                {tracking && !paused && (
                  <div className="mt-2">
                    <Progress 
                      value={(elapsedTime % 60) / 60 * 100} 
                      className="h-1" 
                      aria-label={`${elapsedTime % 60} seconds of current minute elapsed`}
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-0">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-gray-500 stat-icon" aria-hidden="true" />
                      <p className="text-xs text-gray-500 mobile-small-text">Avg. Speed</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800" aria-label={`Average speed: ${calculateAverageSpeed()} kilometers per hour`}>{calculateAverageSpeed()} km/h</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-gray-500 stat-icon" aria-hidden="true" />
                      <p className="text-xs text-gray-500 mobile-small-text">Max Speed</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800" aria-label={`Maximum speed: ${maxSpeed.toFixed(1)} kilometers per hour`}>{maxSpeed.toFixed(1)} km/h</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-gray-500 stat-icon" aria-hidden="true" />
                      <p className="text-xs text-gray-500 mobile-small-text">Elevation</p>
                    </div>
                    <p className="text-lg font-bold text-gray-800" aria-label={elevation !== null ? `Current elevation: ${elevation.toFixed(0)} meters` : 'Elevation data not available'}>
                      {elevation !== null ? `${elevation.toFixed(0)}m` : '-'}
                    </p>
                  </div>
                </div>
                
                {totalAscent > 0 || totalDescent > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mobile-small-text">Ascent</p>
                      <p className="text-lg font-bold text-green-700" aria-label={`Total ascent: ${totalAscent.toFixed(0)} meters`}>↑ {totalAscent.toFixed(0)}m</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mobile-small-text">Descent</p>
                      <p className="text-lg font-bold text-red-700" aria-label={`Total descent: ${totalDescent.toFixed(0)} meters`}>↓ {totalDescent.toFixed(0)}m</p>
                    </div>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Results Modal Overlay */}
        {showResults && (
          <div 
            className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="results-heading"
          >
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="p-5 text-center space-y-4">
                <h2 id="results-heading" className="text-2xl font-bold flex items-center justify-center gap-2">
                  <Award className="text-yellow-500" aria-hidden="true" /> 
                  Track Completed!
                </h2>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="text-lg font-bold">{calculateDistance()} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="text-lg font-bold">{formatTime(elapsedTime)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Speed</p>
                    <p className="text-lg font-bold">{calculateAverageSpeed()} km/h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Speed</p>
                    <p className="text-lg font-bold">{maxSpeed.toFixed(1)} km/h</p>
                  </div>
                  
                  {totalAscent > 0 || totalDescent > 0 ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Total Ascent</p>
                        <p className="text-lg font-bold text-green-700">↑ {totalAscent.toFixed(0)}m</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Descent</p>
                        <p className="text-lg font-bold text-red-700">↓ {totalDescent.toFixed(0)}m</p>
                      </div>
                    </>
                  ) : null}
                </div>
                
                {mapImage && (
                  <div>
                    <p className="font-bold mb-2">Your Route:</p>
                    <img src={mapImage} alt="Map showing your completed route" className="rounded-lg border border-gray-300 w-full" />
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-2">
                  <Button 
                    onClick={handleFinish} 
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={isSaving || saveSuccess === true}
                    aria-label={isSaving ? "Saving track data" : saveSuccess === true ? "Track saved successfully" : "Save track data"}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : saveSuccess === true ? (
                      <>
                        <Award className="mr-2 h-4 w-4" aria-hidden="true" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="mr-2 h-4 w-4" aria-hidden="true" />
                        Save Track
                      </>
                    )}
                  </Button>
                  
                  {mapImage && (
                    <Button 
                      onClick={downloadTrackImage} 
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      aria-label="Download route image"
                    >
                      <DownloadCloud className="mr-2 h-4 w-4" aria-hidden="true" />
                      Download Image
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => setShowResults(false)} 
                    className="bg-gray-600 text-white hover:bg-gray-700"
                    aria-label="Close results window"
                  >
                    Close
                  </Button>
                  
                  <Button 
                    onClick={resetTracking} 
                    className="bg-gray-800 text-white hover:bg-gray-700"
                    aria-label="Reset tracking data"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default GpsTracker;
