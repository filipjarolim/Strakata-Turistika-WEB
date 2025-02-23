'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Pause, PlayCircle, RefreshCcw, Target } from 'lucide-react';
import { useMap } from 'react-leaflet';

// Create a dedicated component that re-centers the map when its trigger changes
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

// Dynamically load react-leaflet components
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

// Constants & configurations
const ZOOM_LEVEL = 15;
const MIN_DISTANCE_KM = 0.01;
const MIN_UPDATE_INTERVAL = 5000; // in ms
const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Marker Icon Configuration
const currentPositionIcon = L.icon({
  iconUrl: 'icons/dog_emoji.png',
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  className: 'custom-marker',
});

// Haversine formula for distance calculation
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
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
  const saved = localStorage.getItem('lastKnownLocation');
  return saved ? JSON.parse(saved) : null;
};

const GpsTracker: React.FC = () => {
  // Tracking states
  const mapRef = useRef<L.Map | null>(null);
  const [tracking, setTracking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  // Timing states (excluding paused durations)
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number>(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  // Current speed (km/h)
  const [speed, setSpeed] = useState<number>(0);
  // Fullscreen state (for legacy fullscreen handling)
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  // Show results modal after tracking ends
  const [showResults, setShowResults] = useState<boolean>(false);
  // Trigger for recentering the map (increments every time recenter is requested)
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  // Listen for full screen changes
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  // Set initial map center based on connectivity
  useEffect(() => {
    if (!navigator.onLine) {
      setIsOffline(true);
      const cached = getStoredLocation();
      if (cached) setMapCenter(cached);
    } else {
      setIsOffline(false);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setMapCenter(loc);
          localStorage.setItem('lastKnownLocation', JSON.stringify(loc));
        },
        (err) => console.error('Error retrieving position:', err),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  // Update elapsed time every second (if not paused)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tracking && startTime && !paused) {
      timer = setInterval(() => {
        setElapsedTime(
          Math.floor((Date.now() - startTime - pauseDuration) / 1000)
        );
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [tracking, startTime, pauseDuration, paused]);

  // Request notification permission when tracking starts
  useEffect(() => {
    if (tracking && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [tracking]);

  // Periodic notifications (every minute)
  useEffect(() => {
    let notifyInterval: NodeJS.Timeout;
    if (tracking && !paused) {
      notifyInterval = setInterval(() => {
        if (Notification.permission === 'granted') {
          new Notification('Tracking Active', {
            body: `Elapsed time: ${formatTime(elapsedTime)}.`,
            icon: 'icons/dog_emoji.png',
          });
        }
      }, 60000);
    }
    return () => notifyInterval && clearInterval(notifyInterval);
  }, [tracking, elapsedTime, paused]);

  // Start tracking: request full screen and begin geolocation
  const startTracking = useCallback(() => {
    setTracking(true);
    setCompleted(false);
    setShowResults(false);
    setStartTime(Date.now());
    setPauseDuration(0);
    setElapsedTime(0);

    // Request full screen mode (optional)
    if (document.documentElement.requestFullscreen) {
      document.documentElement
        .requestFullscreen()
        .catch((err) => console.error('Full screen error:', err));
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (paused) return;
        const newPos: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        const currentTime = Date.now();
        let computedSpeed = pos.coords.speed;
        if (computedSpeed === null && positions.length > 0 && lastUpdateTime) {
          const [lastLat, lastLon] = positions[positions.length - 1];
          computedSpeed =
            haversineDistance(lastLat, lastLon, newPos[0], newPos[1]) /
            ((currentTime - lastUpdateTime) / 3600000);
        } else if (computedSpeed !== null) {
          computedSpeed *= 3.6;
        }
        if (computedSpeed !== null) setSpeed(computedSpeed);
        setPositions((prev) => {
          if (prev.length > 0) {
            const [lastLat, lastLon] = prev[prev.length - 1];
            const dist = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]);
            if (
              dist < MIN_DISTANCE_KM &&
              lastUpdateTime &&
              currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL
            ) {
              return prev;
            }
          }
          setLastUpdateTime(currentTime);
          return [...prev, newPos];
        });
      },
      (err) => console.error('Error watching position:', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    setWatchId(id);
  }, [paused, positions, lastUpdateTime]);

  // Stop tracking: exit full screen, clear watch, and show results modal
  const stopTracking = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
    setWatchId(null);
    setCompleted(true);
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .catch((err) => console.error('Exit full screen error:', err));
    }
    setShowResults(true);
  }, [watchId]);

  // Pause tracking: record pause time
  const pauseTracking = useCallback(() => {
    setPaused(true);
    setLastPauseTime(Date.now());
  }, []);

  // Resume tracking: update pause duration
  const resumeTracking = useCallback(() => {
    if (lastPauseTime) {
      setPauseDuration((prev) => prev + (Date.now() - lastPauseTime));
    }
    setLastPauseTime(null);
    setPaused(false);
  }, [lastPauseTime]);

  // Reset tracking data and hide results modal
  const resetTracking = useCallback(() => {
    setPositions([]);
    setStartTime(null);
    setElapsedTime(0);
    setPauseDuration(0);
    setLastPauseTime(null);
    setCompleted(false);
    setSpeed(0);
    setShowResults(false);
  }, []);

  // Recenter the map by obtaining the latest location, updating mapCenter, and triggering recentering.
  const recenterMap = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setMapCenter(loc);
        // Increment the trigger so RecenterMapComponent re-runs its effect.
        setRecenterTrigger((prev) => prev + 1);
      },
      (err) => console.error('Error recentering map:', err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Helper: calculate total distance traveled
  const calculateDistance = (): string => {
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

  // Helper: format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  // Helper: calculate average speed (km/h)
  const calculateAverageSpeed = (): string => {
    if (elapsedTime === 0) return '0.0';
    const distance = parseFloat(calculateDistance());
    const avg = (distance * 3600) / elapsedTime;
    return avg.toFixed(1);
  };

  return (
    <div className="relative rounded-lg shadow-lg overflow-hidden" style={{ width: '100%', height: '80vh' }}>
      {/* Map as Card Background with lower z-index */}
      <MapContainerWrapper
        center={mapCenter || [0, 0]}
        zoom={ZOOM_LEVEL}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }}
      >
        <TileLayerWrapper attribution="&copy; OpenStreetMap contributors" url={TILE_LAYER_URL} />
        {positions.length > 0 && (
          <MarkerWrapper position={positions[positions.length - 1]} icon={currentPositionIcon} />
        )}
        {positions.length > 1 && (
          <PolylineWrapper
            positions={positions}
            color="#007aff"
            weight={6}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {/* Render the RecenterMapComponent inside the MapContainer */}
        <RecenterMapComponent trigger={recenterTrigger} center={mapCenter} zoom={ZOOM_LEVEL} />
      </MapContainerWrapper>

      {/* Header Overlay */}
      <div style={{ zIndex: 2 }} className="absolute top-0 left-0 w-full p-4">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">GPSTracker</h1>
      </div>

      {/* Right-Side Controls Card */}
      <div style={{ zIndex: 3 }} className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-90 rounded-lg p-4 shadow-lg flex flex-col gap-3">
        {!tracking ? (
          <Button onClick={startTracking} className="bg-gray-800 text-white hover:bg-gray-700">
            <Play className="mr-2" /> Start
          </Button>
        ) : (
          <>
            {paused ? (
              <Button onClick={resumeTracking} className="bg-gray-800 text-white hover:bg-gray-700">
                <PlayCircle className="mr-2" /> Resume
              </Button>
            ) : (
              <Button onClick={pauseTracking} className="bg-gray-800 text-white hover:bg-gray-700">
                <Pause className="mr-2" /> Pause
              </Button>
            )}
            <Button onClick={stopTracking} className="bg-gray-800 text-white hover:bg-gray-700">
              <StopCircle className="mr-2" /> Stop
            </Button>
          </>
        )}
        <Button onClick={recenterMap} className="bg-gray-800 text-white hover:bg-gray-700">
          <Target className="mr-2" /> Recenter
        </Button>
        <Button onClick={resetTracking} className="bg-gray-800 text-white hover:bg-gray-700">
          <RefreshCcw className="mr-2" /> Reset
        </Button>
      </div>

      {/* Bottom Info Card */}
      <div style={{ zIndex: 3 }} className="absolute bottom-0 left-0 right-0 m-4 bg-white bg-opacity-90 rounded-lg p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-bold text-gray-800">Distance: {calculateDistance()} km</p>
            <p className="text-lg font-bold text-gray-800">Time: {formatTime(elapsedTime)}</p>
            <p className="text-lg font-bold text-gray-800">Speed: {speed.toFixed(1)} km/h</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {isOffline ? 'Offline Mode' : paused ? 'Paused' : 'Tracking Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Results Modal Overlay */}
      {showResults && (
        <div
          style={{ zIndex: 1000 }}
          className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center"
        >
          <div className="bg-white rounded-lg p-6 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Tracking Completed!</h2>
            <p className="mb-2">Distance: {calculateDistance()} km</p>
            <p className="mb-2">Time: {formatTime(elapsedTime)}</p>
            <p className="mb-4">Average Speed: {calculateAverageSpeed()} km/h</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setShowResults(false)} className="bg-gray-800 text-white hover:bg-gray-700">
                Close
              </Button>
              <Button onClick={resetTracking} className="bg-gray-800 text-white hover:bg-gray-700">
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GpsTracker;
