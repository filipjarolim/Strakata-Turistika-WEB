import React, { useEffect, useState, useCallback } from 'react';

interface TrackingSession {
  positions: [number, number][];
  startTime: number;
  elapsedTime: number;
  pauseDuration: number;
  isActive: boolean;
  isPaused: boolean;
}

const GPSTracker: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pauseDuration, setPauseDuration] = useState(0);
  const [wakeLock, setWakeLock] = useState<WakeLock | null>(null);

  const updateElapsedTime = useCallback(() => {
    if (isActive && !isPaused) {
      setElapsedTime(Date.now() - startTime - pauseDuration);
    }
  }, [isActive, isPaused, startTime, pauseDuration]);

  const updateLocation = useCallback(() => {
    if (isActive && !isPaused) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setPositions(prev => [...prev, newPosition]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [isActive, isPaused]);

  const storeTrackingSession = useCallback((session: TrackingSession) => {
    localStorage.setItem('trackingSession', JSON.stringify(session));
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      return await navigator.wakeLock.request('screen');
    } catch (err) {
      console.error('Wake Lock request failed:', err);
      return null;
    }
  }, []);

  const releaseWakeLock = useCallback((lock: WakeLock | null) => {
    if (lock) {
      lock.release().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(updateElapsedTime, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, updateElapsedTime]);

  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(updateLocation, 5000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, updateLocation]);

  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(() => {
        storeTrackingSession({
          positions,
          startTime,
          elapsedTime,
          pauseDuration,
          isActive,
          isPaused
        });
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused, positions, startTime, elapsedTime, pauseDuration, storeTrackingSession]);

  useEffect(() => {
    if (isActive && !isPaused) {
      requestWakeLock().then((lock) => {
        if (lock) {
          setWakeLock(lock);
        }
      });
    } else {
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [isActive, isPaused, wakeLock, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, storeTrackingSession]);

  return (
    <div className="gps-tracker">
      <div className="status">
        {isActive ? (isPaused ? 'Paused' : 'Tracking') : 'Stopped'}
      </div>
      <div className="controls">
        <button onClick={() => setIsActive(!isActive)}>
          {isActive ? 'Stop' : 'Start'}
        </button>
        {isActive && (
          <button onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>
    </div>
  );
};

export default GPSTracker; 