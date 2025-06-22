'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Target, Pause, Play, Zap } from 'lucide-react';
import { 
  storeTrackingSession, 
  getStoredTrackingSession, 
  clearStoredTrackingSession,
  initBackgroundTracking,
  requestWakeLock,
  releaseWakeLock,
  formatTime,
  calculateDistance,
  getBatteryInfo,
  BACKGROUND_TRACKING_INTERVAL
} from '@/components/pwa/gps-tracker/backgroundTracking';

// Type declaration for BatteryManager
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

// Type declaration for Navigator with getBattery
interface NavigatorWithBattery extends Navigator {
  getBattery(): Promise<BatteryManager>;
}

interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

interface TrackingSession {
  id: string;
  startTime: number;
  endTime?: number;
  positions: GPSPosition[];
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  totalAscent: number;
  totalDescent: number;
  isActive: boolean;
  isPaused: boolean;
  lastUpdate: number;
  elapsedTime?: number;
  pauseDuration?: number;
  metadata: {
    deviceInfo: any;
    weatherData?: any;
    batteryLevel?: number;
    isCharging?: boolean;
    networkType?: string;
  };
  syncStatus: 'pending' | 'synced' | 'failed';
  version: string;
}

export const useGPSTracking = () => {
  const [isGPSReady, setIsGPSReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [followPosition, setFollowPosition] = useState(true);
  
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const totalPauseTimeRef = useRef<number>(0);

  // Initialize GPS tracking
  const handleGPSReady = useCallback(() => {
    setIsGPSReady(true);
    
    // Load existing session
    const storedSession = getStoredTrackingSession();
    if (storedSession.isActive) {
      setCurrentSession(storedSession);
      setIsTracking(true);
      setIsPaused(storedSession.isPaused);
      
      if (storedSession.isPaused) {
        totalPauseTimeRef.current = storedSession.pauseDuration || 0;
      }
      
      // Resume elapsed time calculation
      if (!storedSession.isPaused) {
        startTimeRef.current = storedSession.startTime;
        const elapsed = Date.now() - storedSession.startTime - totalPauseTimeRef.current;
        setElapsedTime(elapsed);
      }
    }
    
    // Initialize background tracking
    initBackgroundTracking(
      (session) => {
        setCurrentSession(session);
        setIsTracking(true);
        setIsPaused(session.isPaused);
      },
      (position) => {
        lastPositionRef.current = position;
      }
    );
    
    // Check online status
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    
    // Get battery info
    getBatteryInfo().then(battery => {
      if (battery) {
        setBatteryLevel(battery.level);
      }
    });
    
    toast({ title: "GPS Ready", description: "Location tracking is now available" });
  }, []);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS Not Available", description: "Geolocation is not supported on this device", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      // Request wake lock
      wakeLockRef.current = await requestWakeLock();
      
      // Create new session
      const newSession: TrackingSession = {
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
        elapsedTime: 0,
        pauseDuration: 0,
        metadata: {
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            connectionType: (navigator as any).connection?.effectiveType
          }
        },
        syncStatus: 'pending',
        version: '2.0.0'
      };
      
      setCurrentSession(newSession);
      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      totalPauseTimeRef.current = 0;
      setElapsedTime(0);
      
      // Store session
      storeTrackingSession(newSession);
      
      // Start GPS watching
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp,
            batteryLevel,
            isCharging: false
          };
          
          lastPositionRef.current = newPosition;
          
          // Update session with new position
          setCurrentSession(prev => {
            if (!prev) return prev;
            
            const updatedSession = { ...prev };
            updatedSession.positions = [...prev.positions, newPosition];
            
            // Calculate distance
            if (prev.positions.length > 0) {
              const lastPos = prev.positions[prev.positions.length - 1];
              const distance = calculateDistance(
                lastPos.latitude, lastPos.longitude,
                newPosition.latitude, newPosition.longitude
              );
              updatedSession.totalDistance += distance;
            }
            
            // Calculate speed
            if (newPosition.speed) {
              const speedKmh = newPosition.speed * 3.6; // Convert m/s to km/h
              updatedSession.averageSpeed = (updatedSession.averageSpeed + speedKmh) / 2;
              updatedSession.maxSpeed = Math.max(updatedSession.maxSpeed, speedKmh);
            }
            
            updatedSession.lastUpdate = Date.now();
            updatedSession.totalTime = Date.now() - updatedSession.startTime - totalPauseTimeRef.current;
            
            // Store updated session
            storeTrackingSession(updatedSession);
            
            return updatedSession;
          });
          
          toast({ title: "GPS Signal Acquired", description: "Location tracking is active" });
        },
        (error) => {
          console.error('GPS Error:', error);
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          toast({ title: "GPS Error", description: errorMessage, variant: "destructive" });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      // Start elapsed time calculation
      intervalRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = Date.now() - startTimeRef.current - totalPauseTimeRef.current;
          setElapsedTime(elapsed);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start tracking:', error);
      toast({ title: "Failed to Start Tracking", description: "Please try again", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [batteryLevel, isPaused]);

  // Control tracking (pause/resume/stop)
  const controlTracking = useCallback((action: 'pause' | 'resume' | 'stop') => {
    return () => {
      if (action === 'pause' && isTracking && !isPaused) {
        setIsPaused(true);
        pauseStartTimeRef.current = Date.now();
        
        setCurrentSession(prev => {
          if (!prev) return prev;
          const updated = { ...prev, isPaused: true };
          storeTrackingSession(updated);
          return updated;
        });
        
        toast({ title: "Tracking Paused", description: "GPS tracking has been paused" });
        
      } else if (action === 'resume' && isTracking && isPaused) {
        setIsPaused(false);
        totalPauseTimeRef.current += Date.now() - pauseStartTimeRef.current;
        
        setCurrentSession(prev => {
          if (!prev) return prev;
          const updated = { 
            ...prev, 
            isPaused: false,
            pauseDuration: totalPauseTimeRef.current
          };
          storeTrackingSession(updated);
          return updated;
        });
        
        toast({ title: "Tracking Resumed", description: "GPS tracking has been resumed" });
        
      } else if (action === 'stop' && isTracking) {
        // Stop tracking
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        if (wakeLockRef.current) {
          releaseWakeLock(wakeLockRef.current);
          wakeLockRef.current = null;
        }
        
        // Finalize session
        setCurrentSession(prev => {
          if (!prev) return prev;
          const finalSession = {
            ...prev,
            isActive: false,
            endTime: Date.now(),
            totalTime: Date.now() - prev.startTime - totalPauseTimeRef.current
          };
          
          // Store completed session
          const completedSessions = JSON.parse(localStorage.getItem('completedSessions') || '[]');
          completedSessions.push(finalSession);
          localStorage.setItem('completedSessions', JSON.stringify(completedSessions));
          
          return finalSession;
        });
        
        setIsTracking(false);
        setIsPaused(false);
        setElapsedTime(0);
        
        // Clear current session
        clearStoredTrackingSession();
        
        toast({ title: "Tracking Stopped", description: "GPS tracking has been completed" });
      }
    };
  }, [isTracking, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wakeLockRef.current) {
        releaseWakeLock(wakeLockRef.current);
      }
    };
  }, []);

  return {
    isGPSReady,
    isTracking,
    isPaused,
    currentSession,
    elapsedTime,
    isLoading,
    isOnline,
    batteryLevel,
    followPosition,
    lastPositionRef,
    handleGPSReady,
    startTracking,
    controlTracking,
    setFollowPosition,
    formatTime
  };
}; 