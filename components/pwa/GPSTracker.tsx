'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Pause, PlayCircle, RefreshCcw, Target } from 'lucide-react';
import { useMap } from 'react-leaflet';

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
  // Timing states
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number>(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  // Speed state
  const [speed, setSpeed] = useState<number>(0);
  // Fullscreen state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  // Results and finish image state
  const [showResults, setShowResults] = useState<boolean>(false);
  const [mapImage, setMapImage] = useState<string | null>(null);
  // Trigger for recentering the map
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  // Reference for map container element for capturing
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (!navigator.onLine) {
      setIsOffline(true);
      const cached = getStoredLocation();
      if (cached) setMapCenter(cached);
    } else {
      setIsOffline(false);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
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
    if (tracking && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [tracking]);

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

  const startTracking = useCallback(() => {
    setTracking(true);
    setCompleted(false);
    setShowResults(false);
    setMapImage(null);
    setStartTime(Date.now());
    setPauseDuration(0);
    setElapsedTime(0);

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.error('Full screen error:', err));
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (paused) return;
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
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
            if (dist < MIN_DISTANCE_KM && lastUpdateTime && currentTime - lastUpdateTime < MIN_UPDATE_INTERVAL) {
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

  const stopTracking = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
    setWatchId(null);
    setCompleted(true);
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.error('Exit full screen error:', err));
    }
    setShowResults(true);
  }, [watchId]);

  const pauseTracking = useCallback(() => {
    setPaused(true);
    setLastPauseTime(Date.now());
  }, []);

  const resumeTracking = useCallback(() => {
    if (lastPauseTime) {
      setPauseDuration((prev) => prev + (Date.now() - lastPauseTime));
    }
    setLastPauseTime(null);
    setPaused(false);
  }, [lastPauseTime]);

  const resetTracking = useCallback(() => {
    setPositions([]);
    setStartTime(null);
    setElapsedTime(0);
    setPauseDuration(0);
    setLastPauseTime(null);
    setCompleted(false);
    setSpeed(0);
    setShowResults(false);
    setMapImage(null);
  }, []);

  const recenterMap = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMapCenter(loc);
        setRecenterTrigger((prev) => prev + 1);
      },
      (err) => console.error('Error recentering map:', err),
      { enableHighAccuracy: true }
    );
  }, []);

  // Capture the map as a PNG image and then send it to your API.
  const handleFinish = useCallback(async () => {
    if (!mapContainerRef.current) return;
    try {
      const canvas = await html2canvas(mapContainerRef.current, { useCORS: true });
      const imageData = canvas.toDataURL('image/png');
      setMapImage(imageData);

      // Call your API endpoint to store the track image (season 2025)
      await fetch('/api/saveTrack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          season: 2025,
          image: imageData,
          distance: calculateDistance(),
          elapsedTime,
          averageSpeed: calculateAverageSpeed(),
          fullName: username, // Pass the current user's username
        })
      });
    } catch (error) {
      console.error('Error capturing map image:', error);
    }
  }, [elapsedTime, username]);

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

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  const calculateAverageSpeed = (): string => {
    if (elapsedTime === 0) return '0.0';
    const distance = parseFloat(calculateDistance());
    const avg = (distance * 3600) / elapsedTime;
    return avg.toFixed(1);
  };

  return (
    <div className="relative rounded-lg shadow-lg overflow-hidden" style={{ width: '100%', height: '80vh' }}>
      {/* Map container with id and ref for screenshot */}
      <div id="mapContainer" ref={mapContainerRef} style={{ width: '100%', height: '100%' }}>
        <MapContainerWrapper
          center={mapCenter || [0, 0]}
          zoom={ZOOM_LEVEL}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
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
          <RecenterMapComponent trigger={recenterTrigger} center={mapCenter} zoom={ZOOM_LEVEL} />
        </MapContainerWrapper>
      </div>

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
        <div style={{ zIndex: 1000 }} className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 text-center max-w-md mx-auto space-y-4">
            <h2 className="text-2xl font-bold">Tracking Completed!</h2>
            <p>Distance: {calculateDistance()} km</p>
            <p>Time: {formatTime(elapsedTime)}</p>
            <p>Average Speed: {calculateAverageSpeed()} km/h</p>
            {mapImage && (
              <div>
                <p className="font-bold">Your Route:</p>
                <img src={mapImage} alt="Track" className="mt-2 rounded-lg" />
              </div>
            )}
            <div className="flex justify-center gap-4">
              <Button onClick={handleFinish} className="bg-gray-800 text-white hover:bg-gray-700">
                Finish & Save
              </Button>
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
