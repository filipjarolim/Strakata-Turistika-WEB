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
import TrackingDebug from './gps-tracker/TrackingDebug';
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

// Constants
const UPDATE_INTERVAL = 1000; // Update every second
const MIN_ACCURACY = 35; // Minimum accuracy in meters
const POSITION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
};

interface Position {
  lat: number;
  lng: number;
  time: number;
  speed: number;
}

const GpsTracker: React.FC<GPSTrackerProps> = ({ username, className = '' }) => {
  // Tracking states
  const [tracking, setTracking] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  
  // Timing states
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number>(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  
  // Results state
  const [showResults, setShowResults] = useState<boolean>(false);
  const [mapImage, setMapImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  
  // Reference for map container element
  const mapContainerRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  
  // Speed state
  const [speed, setSpeed] = useState<number>(0);
  
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

  // Periodic position updates
  useEffect(() => {
    let updateInterval: NodeJS.Timeout;
    
    if (tracking && !paused) {
      updateInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (pos.coords.accuracy > MIN_ACCURACY * 2) {
              toast.warning(`Low GPS accuracy: ${pos.coords.accuracy.toFixed(1)}m. Try moving to a more open area.`);
              return;
            }

            const newPos: Position = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: Date.now(),
              speed: (pos.coords.speed !== null && pos.coords.speed !== undefined) ? pos.coords.speed * 3.6 : 0
            };

            setPositions(prev => [...prev, newPos]);
            setMapCenter([newPos.lat, newPos.lng]);
          },
          (err) => {
            console.error('Error getting position:', err);
            toast.error('Failed to get position. Please check your GPS signal.');
          },
          POSITION_OPTIONS
        );
      }, UPDATE_INTERVAL);
    }

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, [tracking, paused]);

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
    setPositions([]);
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const initialPos: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: Date.now(),
          speed: (pos.coords.speed !== null && pos.coords.speed !== undefined) ? pos.coords.speed * 3.6 : 0
        };
        
        setPositions([initialPos]);
        setMapCenter([initialPos.lat, initialPos.lng]);
        setLoading(false);
      },
      (err) => {
        console.error('Error getting initial position:', err);
        toast.error('Failed to get initial position. Please check your GPS signal.');
        setLoading(false);
      },
      POSITION_OPTIONS
    );
    
    toast.success('GPS tracking started!');
  }, []);

  const stopTracking = useCallback(() => {
    setTracking(false);
    setCompleted(true);
    
    if (positions.length > 1) {
      setShowResults(true);
      captureMapImage();
    } else {
      toast.warning('No track data to save.');
    }
  }, [positions.length]);

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
    setShowResults(false);
    setMapImage(null);
    setSaveSuccess(null);
    toast.info('Tracking reset');
  }, []);

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

  const handleFinish = useCallback(async () => {
    if (positions.length <= 1) {
      toast.error('Not enough tracking data to save');
      return;
    }
    
    setIsSaving(true);
    
    const distance = positions.reduce((total, pos, index) => {
      if (index === 0) return 0;
      const prevPos = positions[index - 1];
      return total + haversineDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
    }, 0).toFixed(2);
    
    const avgSpeed = positions.length > 1 
      ? ((parseFloat(distance) * 3600) / elapsedTime).toFixed(1)
      : '0.0';
    
    const maxSpeed = Math.max(...positions.map(pos => pos.speed || 0)).toFixed(1);
    
    const trackData: TrackData = {
      season: new Date().getFullYear(),
      image: mapImage || '',
      distance,
      elapsedTime,
      averageSpeed: avgSpeed,
      fullName: username || 'Unknown User',
      maxSpeed,
      totalAscent: '0',
      totalDescent: '0',
      timestamp: Date.now(),
      positions: positions.map(pos => [pos.lat, pos.lng])
    };

    try {
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
    } catch (error) {
      console.error('Error saving track:', error);
      toast.error('Failed to save track data');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  }, [positions, username, mapImage, elapsedTime]);

  const handlePositionUpdate = (position: GeolocationPosition) => {
    const { latitude, longitude, speed: gpsSpeed } = position.coords;
    const currentTime = new Date().getTime();
    
    const newPosition: Position = {
      lat: latitude,
      lng: longitude,
      time: currentTime,
      speed: (gpsSpeed !== null && gpsSpeed !== undefined) ? gpsSpeed * 3.6 : 0
    };
    
    setPositions(prev => [...prev, newPosition]);
    setMapCenter([latitude, longitude]);
    setRecenterTrigger(prev => prev + 1);
  };

  const handlePauseResume = () => {
    if (paused) {
      // Resume tracking
      setPaused(false);
      setPositions(prev => {
        if (prev.length === 0) return prev;
        const lastPos = prev[prev.length - 1];
        const newPosition: Position = {
          lat: lastPos.lat,
          lng: lastPos.lng,
          time: new Date().getTime(),
          speed: 0
        };
        return [...prev, newPosition];
      });
    } else {
      // Pause tracking
      setPaused(true);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value === '' ? 0 : Number(e.target.value);
    setSpeed(isNaN(numericValue) ? 0 : numericValue);
  };

  return (
    <div className={`relative bg-gray-100 w-full md:w-[400px] h-screen mx-auto rounded-none md:rounded-[40px] overflow-hidden shadow-2xl ${className}`}>
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
          mapCenter={mapCenter || [0, 0]}
          positions={positions.map(p => [p.lat, p.lng])}
          mapType={mapType}
          mapContainerRef={mapContainerRef}
          loading={loading}
          className="w-full h-full"
          recenterTrigger={recenterTrigger}
        />

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <Drawer defaultOpen modal={false}>
            <DrawerTrigger asChild>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm flex items-center justify-between px-4 cursor-pointer transition-all duration-300 hover:bg-white group">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      {positions.reduce((total, pos, index) => {
                        if (index === 0) return 0;
                        const prevPos = positions[index - 1];
                        return total + haversineDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
                      }, 0).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                    <Clock className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">{formatTime(elapsedTime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-orange-50 px-3 py-1.5 rounded-full">
                    <Gauge className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">
                      {positions.length > 0 ? (positions[positions.length - 1].speed || 0).toFixed(1) : '0.0'} km/h
                    </span>
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
                    distance={positions.reduce((total, pos, index) => {
                      if (index === 0) return 0;
                      const prevPos = positions[index - 1];
                      return total + haversineDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
                    }, 0).toFixed(2)}
                    elapsedTime={elapsedTime}
                    speed={positions.length > 0 ? positions[positions.length - 1].speed || 0 : 0}
                    className="mb-4"
                  />

                  <ControlsComponent
                    tracking={tracking}
                    paused={paused}
                    isOffline={false}
                    loading={loading}
                    onStartTracking={startTracking}
                    onStopTracking={stopTracking}
                    onPauseTracking={pauseTracking}
                    onResumeTracking={resumeTracking}
                    onRecenterMap={() => {
                      if (positions.length > 0) {
                        const lastPos = positions[positions.length - 1];
                        setMapCenter([lastPos.lat, lastPos.lng]);
                      }
                    }}
                    onToggleMapType={() => setMapType(prev => prev === 'standard' ? 'satellite' : 'standard')}
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
          distance={positions.reduce((total, pos, index) => {
            if (index === 0) return 0;
            const prevPos = positions[index - 1];
            return total + haversineDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
          }, 0).toFixed(2)}
          elapsedTime={elapsedTime}
          avgSpeed={positions.length > 1 
            ? ((positions.reduce((total, pos, index) => {
                if (index === 0) return 0;
                const prevPos = positions[index - 1];
                return total + haversineDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
              }, 0) * 3600) / elapsedTime).toFixed(1)
            : '0.0'}
          maxSpeed={Math.max(...positions.map(pos => pos.speed || 0))}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          onClose={() => setShowResults(false)}
          onFinish={handleFinish}
          onReset={resetTracking}
          className="bg-white rounded-lg shadow-xl"
        />

        {/* Development debug panel */}
        <TrackingDebug positions={positions} />
      </div>
    </div>
  );
};

export default GpsTracker;
