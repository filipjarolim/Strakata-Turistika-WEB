// useGeoTracker.ts
import { useState, useEffect, useCallback } from 'react';
import { haversineDistance } from '@/lib/utils'; // extract utility functions if desired

export const useGeoTracker = () => {
  const [tracking, setTracking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number>(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(0);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const MIN_DISTANCE_KM = 0.01;
  const MIN_UPDATE_INTERVAL = 5000;
  const ZOOM_LEVEL = 15;

  // Set initial center
  useEffect(() => {
    if (navigator.geolocation) {
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
  }, []);

  // Update elapsed time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (tracking && startTime && !paused) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime - pauseDuration) / 1000));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [tracking, startTime, pauseDuration, paused]);

  const startTracking = useCallback(() => {
    setTracking(true);
    setStartTime(Date.now());
    setPauseDuration(0);
    setElapsedTime(0);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (paused) return;
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const currentTime = Date.now();
        let computedSpeed = pos.coords.speed;
        if (computedSpeed === null && positions.length > 0) {
          const [lastLat, lastLon] = positions[positions.length - 1];
          computedSpeed =
            haversineDistance(lastLat, lastLon, newPos[0], newPos[1]) /
            ((currentTime - (positions.length && currentTime)) / 3600000);
        } else if (computedSpeed !== null) {
          computedSpeed *= 3.6;
        }
        if (computedSpeed !== null) setSpeed(computedSpeed);
        setPositions((prev) => {
          if (prev.length > 0) {
            const [lastLat, lastLon] = prev[prev.length - 1];
            const dist = haversineDistance(lastLat, lastLon, newPos[0], newPos[1]);
            if (dist < MIN_DISTANCE_KM) return prev;
          }
          return [...prev, newPos];
        });
      },
      (err) => console.error('Error watching position:', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    setWatchId(id);
  }, [paused, positions]);

  const stopTracking = useCallback(() => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    setTracking(false);
  }, [watchId]);

  const pauseTracking = useCallback(() => {
    setPaused(true);
    setLastPauseTime(Date.now());
  }, []);

  const resumeTracking = useCallback(() => {
    if (lastPauseTime) setPauseDuration((prev) => prev + (Date.now() - lastPauseTime));
    setLastPauseTime(null);
    setPaused(false);
  }, [lastPauseTime]);

  const resetTracking = useCallback(() => {
    setPositions([]);
    setStartTime(null);
    setElapsedTime(0);
    setPauseDuration(0);
    setLastPauseTime(null);
    setTracking(false);
    setSpeed(0);
  }, []);

  const recenterMap = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setMapCenter(loc);
          setRecenterTrigger((prev) => prev + 1);
        },
        (err) => console.error('Error recentering map:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const calculateDistance = useCallback((): string => {
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
  }, [positions]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  }, []);

  const calculateAverageSpeed = useCallback((): string => {
    if (elapsedTime === 0) return '0.0';
    const distance = parseFloat(calculateDistance());
    const avg = (distance * 3600) / elapsedTime;
    return avg.toFixed(1);
  }, [elapsedTime, calculateDistance]);

  return {
    tracking,
    paused,
    positions,
    speed,
    elapsedTime,
    mapCenter,
    recenterTrigger,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    resetTracking,
    calculateDistance,
    formatTime,
    calculateAverageSpeed,
  };
};
