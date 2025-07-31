'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';





interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
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
  };
  version: string;
}

export const useGPSTracking = () => {
  const [isGPSReady, setIsGPSReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const [followPosition, setFollowPosition] = useState(true);
  
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const totalPauseTimeRef = useRef<number>(0);

  // Initialize GPS tracking
  const handleGPSReady = useCallback(() => {
    setIsGPSReady(true);
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
  
        version: '2.0.0'
      };
      
      setCurrentSession(newSession);
      setIsTracking(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      totalPauseTimeRef.current = 0;
      setElapsedTime(0);
      

      
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

          };
          
          lastPositionRef.current = newPosition;
          
          // Update session with new position
          setCurrentSession(prev => {
            if (!prev) return prev;
            
            const updatedSession = { ...prev };
            updatedSession.positions = [...prev.positions, newPosition];
            

            
            // Calculate speed
            if (newPosition.speed) {
              const speedKmh = newPosition.speed * 3.6; // Convert m/s to km/h
              updatedSession.averageSpeed = (updatedSession.averageSpeed + speedKmh) / 2;
              updatedSession.maxSpeed = Math.max(updatedSession.maxSpeed, speedKmh);
            }
            
            updatedSession.lastUpdate = Date.now();
            updatedSession.totalTime = Date.now() - updatedSession.startTime - totalPauseTimeRef.current;
            

            
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
      }, [isPaused]);

  // Control tracking (pause/resume/stop)
  const controlTracking = useCallback((action: 'pause' | 'resume' | 'stop') => {
    return () => {
      if (action === 'pause' && isTracking && !isPaused) {
        setIsPaused(true);
        pauseStartTimeRef.current = Date.now();
        
        setCurrentSession(prev => {
          if (!prev) return prev;
          const updated = { ...prev, isPaused: true };
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

    };
  }, []);

  // Format time utility function
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  return {
    isGPSReady,
    isTracking,
    isPaused,
    currentSession,
    elapsedTime,
    isLoading,

    
    followPosition,
    lastPositionRef,
    handleGPSReady,
    startTracking,
    controlTracking,
    setFollowPosition,
    formatTime
  };
}; 