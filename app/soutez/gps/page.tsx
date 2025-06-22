'use client';

// GPS Page with enhanced iOS-style animations and interactions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { GPSLoadingScreen } from "@/components/ui/GPSLoadingScreen";
import { 
  IOSBottomSheet, 
  IOSBottomSheetContent, 
  IOSBottomSheetTrigger,
  IOSBottomSheetTitle,
  IOSBottomSheetDescription
} from "@/components/ui/ios/bottom-sheet";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSCard } from "@/components/ui/ios/card";
import { 
  Play, Pause, Square, MapPin, Clock, Navigation, Activity, MoreHorizontal, Route, AlertTriangle, Phone, X, Maximize2, 
  Zap, Target, TrendingUp, Wifi, WifiOff, Battery, BatteryCharging
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  storeTrackingSession, 
  getStoredTrackingSession, 
  clearStoredTrackingSession,
  calculateDistance,
  formatTime,
  EnhancedTrackingSession,
  GPSPosition
} from "@/components/pwa/gps-tracker/backgroundTracking";
import dynamic from 'next/dynamic';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import { motion, AnimatePresence } from "framer-motion";

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

// Import a proper map component inspired by GpxEditor
const GPSMapComponent = dynamic(
  () => import('@/components/pwa/gps-tracker/GPSMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <MapPin className="h-16 w-16 text-blue-400 drop-shadow-lg" />
          </motion.div>
          <motion.p 
            className="text-sm text-gray-600 mt-4 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Loading GPS Map...
          </motion.p>
        </motion.div>
      </div>
    )
  }
);

const StatCard = ({ title, value, icon, unit, trend }: {
  title: string, 
  value: string | number, 
  icon: React.ReactNode, 
  unit?: string,
  trend?: { value: number; isPositive: boolean }
}) => (
  <motion.div 
    className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 text-center border border-white/50 shadow-xl shadow-black/10"
    whileHover={{ scale: 1.03, y: -3, rotateY: 2 }}
    whileTap={{ scale: 0.97 }}
    transition={{ 
      type: "spring", 
      stiffness: 300, 
      damping: 20,
      mass: 0.8
    }}
    style={{
      transformStyle: "preserve-3d"
    }}
  >
    <motion.div 
      className="flex items-center justify-center gap-2 text-gray-500 mb-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div 
        className="p-2 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/80 shadow-sm"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {icon}
      </motion.div>
      <span className="text-xs font-semibold">{title}</span>
    </motion.div>
    <motion.div 
      className="flex items-baseline justify-center gap-1"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <p className="text-2xl font-bold text-gray-900">
        {value}
      </p>
      {unit && <span className="text-sm font-medium text-gray-500">{unit}</span>}
    </motion.div>
    {trend && (
      <motion.div 
        className={cn(
          "flex items-center justify-center gap-1 text-xs font-medium px-2 py-1 rounded-full mt-2",
          trend.isPositive ? "text-green-600 bg-green-100/60" : "text-red-600 bg-red-100/60"
        )}
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
      >
        <motion.div
          animate={{ rotate: trend.isPositive ? [0, 10, -10, 0] : [0, -10, 10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <TrendingUp className={cn("w-3 h-3", trend.isPositive ? "rotate-0" : "rotate-180")} />
        </motion.div>
        {trend.value}%
      </motion.div>
    )}
  </motion.div>
);

const ActionButton = ({ onClick, children, className = '', icon }: { 
  onClick?: () => void, 
  children: React.ReactNode, 
  className?: string,
  icon?: React.ReactNode
}) => (
  <motion.button 
    onClick={onClick} 
    className={cn(
      "w-full flex items-center justify-between p-4 rounded-2xl bg-white/90 backdrop-blur-xl hover:bg-white/95 transition-all duration-300 border border-white/50 shadow-lg shadow-black/5",
      className
    )}
    whileHover={{ scale: 1.02, y: -2, rotateY: 1 }}
    whileTap={{ scale: 0.98 }}
    transition={{ 
      type: "spring", 
      stiffness: 300, 
      damping: 25,
      mass: 0.8
    }}
    style={{
      transformStyle: "preserve-3d"
    }}
  >
    <span className="font-medium text-gray-800">{children}</span>
    <div className="flex items-center gap-2">
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {icon}
      </motion.div>
      <motion.div 
        className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </motion.div>
    </div>
  </motion.button>
);

const StatusIndicator = ({ isOnline, batteryLevel }: { isOnline: boolean, batteryLevel?: number }) => (
  <div className="flex items-center gap-2">
    <motion.div 
      className={cn(
        "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm",
        isOnline ? "text-green-600 bg-green-100/60 border border-green-200/50" : "text-red-600 bg-red-100/60 border border-red-200/50"
      )}
      initial={{ opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        animate={{ 
          scale: isOnline ? [1, 1.2, 1] : [1, 0.8, 1],
          opacity: isOnline ? [1, 0.8, 1] : [1, 0.5, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      </motion.div>
      {isOnline ? "Online" : "Offline"}
    </motion.div>
    {batteryLevel !== undefined && (
      <motion.div 
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100/60 border border-gray-200/50 shadow-sm"
        initial={{ opacity: 0, scale: 0.8, x: -20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        whileHover={{ scale: 1.05 }}
      >
        <motion.div
          animate={{ 
            scale: batteryLevel < 20 ? [1, 1.2, 1] : 1,
            color: batteryLevel < 20 ? ["#ef4444", "#dc2626", "#ef4444"] : "#6b7280"
          }}
          transition={{ duration: 1.5, repeat: batteryLevel < 20 ? Infinity : 0 }}
        >
          {batteryLevel > 20 ? <Battery className="w-3 h-3" /> : <BatteryCharging className="w-3 h-3" />}
        </motion.div>
        {batteryLevel}%
      </motion.div>
    )}
  </div>
);

const GPSPage = () => {
  const [isGPSReady, setIsGPSReady] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSession, setCurrentSession] = useState<EnhancedTrackingSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>();
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef<EnhancedTrackingSession | null>(null);
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  
  const currentUser = useCurrentUser();
  const currentRole = useCurrentRole();
  
  const handleGPSReady = useCallback(() => setIsGPSReady(true), []);

  // Monitor online status and battery
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Get battery level if available
    if ('getBattery' in navigator) {
      const navigatorWithBattery = navigator as Navigator & { getBattery(): Promise<BatteryManager> };
      navigatorWithBattery.getBattery().then((battery) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (sessionRef.current?.isActive && !sessionRef.current.isPaused) {
        const elapsed = Date.now() - sessionRef.current.startTime;
        setElapsedTime(elapsed);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, []);

  const initializeSession = useCallback(() => {
    const session: EnhancedTrackingSession = {
      id: `session_${Date.now()}`,
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
      metadata: {
          deviceInfo: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              screenResolution: `${screen.width}x${screen.height}`
          }
      },
      syncStatus: 'pending',
      version: '2.0.0'
    };
    setCurrentSession(session);
    sessionRef.current = session;
    return session;
  }, []);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const gpsPosition: GPSPosition = {
      latitude: position.coords.latitude, longitude: position.coords.longitude,
      altitude: position.coords.altitude ?? undefined, accuracy: position.coords.accuracy,
      speed: position.coords.speed ? position.coords.speed * 3.6 : undefined, // km/h
      heading: position.coords.heading ?? undefined, timestamp: position.timestamp
    };

    if (sessionRef.current?.isActive && !sessionRef.current.isPaused) {
      const session = sessionRef.current;
      if (lastPositionRef.current) {
        session.totalDistance += calculateDistance(lastPositionRef.current.latitude, lastPositionRef.current.longitude, gpsPosition.latitude, gpsPosition.longitude);
      }
      if (gpsPosition.speed && gpsPosition.speed > session.maxSpeed) session.maxSpeed = gpsPosition.speed;
      session.positions.push(gpsPosition);
      session.totalTime = Date.now() - session.startTime;
      session.averageSpeed = session.totalDistance > 0 ? session.totalDistance / (session.totalTime / 3600000) : 0;
      setCurrentSession({ ...session });
      storeTrackingSession(session);
    }
    lastPositionRef.current = gpsPosition;
  }, []);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) return toast.error('GPS is not supported.');
    setIsLoading(true);
    initializeSession();
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('Failed to acquire wake lock:', err);
      }
    }
    const id = navigator.geolocation.watchPosition(handlePositionUpdate, (e) => toast.error(`GPS Error: ${e.message}`), { enableHighAccuracy: true });
    setWatchId(id);
    setIsTracking(true);
    setIsPaused(false);
    startTimer();
    toast.success('GPS Tracking Started', {
      description: 'Your route is now being recorded',
      icon: <Target className="w-4 h-4" />
    });
    setIsLoading(false);
  }, [initializeSession, handlePositionUpdate, startTimer]);

  const controlTracking = (action: 'pause' | 'resume' | 'stop') => async () => {
    const session = sessionRef.current;
    if (!session) return;

    if (action === 'pause') {
      session.isPaused = true;
      setIsPaused(true);
      toast.info('Tracking Paused', {
        description: 'Your route recording has been paused',
        icon: <Pause className="w-4 h-4" />
      });
    } else if (action === 'resume') {
      session.isPaused = false;
      setIsPaused(false);
      toast.success('Tracking Resumed', {
        description: 'Your route recording has been resumed',
        icon: <Play className="w-4 h-4" />
      });
    } else if (action === 'stop') {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      stopTimer();
      if (wakeLockRef.current) await wakeLockRef.current.release();
      session.isActive = false;
      session.endTime = Date.now();
      const completed = JSON.parse(localStorage.getItem('completedSessions') || '[]');
      completed.push(session);
      localStorage.setItem('completedSessions', JSON.stringify(completed));
      clearStoredTrackingSession();
      sessionRef.current = null;
      setIsTracking(false);
      setIsPaused(false);
      setElapsedTime(0);
      setCurrentSession(null);
      toast.success('Tracking Completed', {
        description: 'Your route has been saved successfully',
        icon: <Zap className="w-4 h-4" />
      });
      return;
    }
    setCurrentSession({ ...session });
    storeTrackingSession(session);
  };

  useEffect(() => {
    const savedSession = getStoredTrackingSession();
    if (savedSession?.isActive) {
      sessionRef.current = savedSession;
      setCurrentSession(savedSession);
      setIsTracking(true);
      setIsPaused(savedSession.isPaused);
      if (!savedSession.isPaused) startTracking();
    }
  }, [startTracking]);

  // Fullscreen handler
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);
  
  if (!isGPSReady) return <GPSLoadingScreen onReady={handleGPSReady} isOnline={isOnline} />;

  const mapTrackPoints = currentSession?.positions.map(pos => ({ lat: pos.latitude, lng: pos.longitude })) || [];

  return (
    <CommonPageTemplate currentUser={currentUser} currentRole={currentRole} mobileLayout={true} className="p-0 overflow-hidden">
      <IOSBottomSheet shouldScaleBackground={true}>
        <motion.div 
          className={cn("w-full h-full", isFullscreen && "fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className={cn("w-full h-full", isFullscreen && "max-w-6xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden")}
            initial={isFullscreen ? { scale: 0.9, opacity: 0 } : {}}
            animate={isFullscreen ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="absolute inset-0 z-0">
              <GPSMapComponent 
                trackPoints={mapTrackPoints} 
                isTracking={isTracking}
                isPaused={isPaused}
                currentPosition={lastPositionRef.current}
              />
            </div>
            
            {/* Status Bar */}
            <motion.div 
              className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 300 }}
            >
              <StatusIndicator isOnline={isOnline} batteryLevel={batteryLevel} />
              
              {/* Fullscreen toggle button */}
              <motion.button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-12 h-12 bg-white/95 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl shadow-black/10 border border-white/50 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <motion.div
                  animate={{ rotate: isFullscreen ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {isFullscreen ? <X className="h-5 w-5 text-gray-700" /> : <Maximize2 className="h-5 w-5 text-gray-700" />}
                </motion.div>
              </motion.button>
            </motion.div>
            
            {/* Live Stats Overlay */}
            <AnimatePresence mode="wait">
              {isTracking && (
                <motion.div 
                  className="absolute top-20 left-4 right-4 z-10"
                  initial={{ opacity: 0, y: -30, scale: 0.9, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  exit={{ opacity: 0, y: -30, scale: 0.9, rotateX: -15 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  style={{
                    transformStyle: "preserve-3d"
                  }}
                >
                  <motion.div 
                    className="grid grid-cols-3 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    >
                      <StatCard 
                        title="Distance" 
                        icon={<Navigation size={16}/>} 
                        value={currentSession?.totalDistance.toFixed(2) || '0.00'} 
                        unit="km" 
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                    >
                      <StatCard 
                        title="Time" 
                        icon={<Clock size={16}/>} 
                        value={formatTime(elapsedTime || currentSession?.totalTime || 0)} 
                        unit="" 
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                    >
                      <StatCard 
                        title="Avg. Speed" 
                        icon={<Activity size={16}/>} 
                        value={currentSession?.averageSpeed.toFixed(1) || '0.0'} 
                        unit="km/h" 
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Control Buttons */}
            <motion.div 
              className="absolute bottom-4 left-4 right-4 z-10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 300 }}
            >
              {!isTracking ? (
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <IOSButton 
                    size="lg" 
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40" 
                    onClick={startTracking} 
                    loading={isLoading}
                  >
                    <motion.div
                      animate={{ 
                        scale: isLoading ? [1, 1.1, 1] : 1,
                        rotate: isLoading ? [0, 5, -5, 0] : 0
                      }}
                      transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
                    >
                      <Play className="mr-3 h-6 w-6" />
                    </motion.div>
                    Start GPS Tracking
                  </IOSButton>
                </motion.div>
              ) : (
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {isPaused ? (
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex-1"
                    >
                      <IOSButton 
                        size="lg" 
                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 via-green-600 to-green-700 shadow-2xl shadow-green-500/30 hover:shadow-green-500/40" 
                        onClick={controlTracking('resume')}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Play className="mr-3 h-6 w-6" />
                        </motion.div>
                        Resume
                      </IOSButton>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex-1"
                    >
                      <IOSButton 
                        size="lg" 
                        variant="outline" 
                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 border-amber-500/50 text-white shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/40" 
                        onClick={controlTracking('pause')}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Pause className="mr-3 h-6 w-6" />
                        </motion.div>
                        Pause
                      </IOSButton>
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <IOSButton 
                      size="icon" 
                      variant="outline" 
                      className="h-16 w-16 bg-gradient-to-r from-red-500 via-red-600 to-red-700 border-red-600/50 text-white shadow-2xl shadow-red-500/30 hover:shadow-red-500/40" 
                      onClick={controlTracking('stop')}
                    >
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Square className="h-8 w-8" />
                      </motion.div>
                    </IOSButton>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <IOSBottomSheetTrigger asChild>
                      <IOSButton 
                        size="icon" 
                        variant="outline" 
                        className="h-16 w-16 bg-white/95 border-white/50 text-gray-700 shadow-2xl shadow-black/10 hover:shadow-black/20"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <MoreHorizontal className="h-8 w-8" />
                        </motion.div>
                      </IOSButton>
                    </IOSBottomSheetTrigger>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        
        <IOSBottomSheetContent>
          <IOSBottomSheetTitle className="text-xl font-bold mb-2">
            GPS Tracking Details
          </IOSBottomSheetTitle>
          <IOSBottomSheetDescription className="mb-4">
            View your current tracking session statistics and options.
          </IOSBottomSheetDescription>
          <div className="space-y-4 pb-16">
            <IOSCard variant="outlined">
              <div className="grid grid-cols-3 gap-3">
                <StatCard title="Distance" icon={<Navigation size={14}/>} value={currentSession?.totalDistance.toFixed(2) || '0.00'} unit="km" />
                <StatCard title="Time" icon={<Clock size={14}/>} value={formatTime(elapsedTime || currentSession?.totalTime || 0)} unit="" />
                <StatCard title="Avg. Speed" icon={<Activity size={14}/>} value={currentSession?.averageSpeed.toFixed(1) || '0.0'} unit="km/h" />
              </div>
            </IOSCard>

            <h3 className="text-lg font-semibold text-gray-800 pt-4">Quick Actions</h3>
            <div className="space-y-2">
              <ActionButton icon={<Route size={20} className="text-gray-500"/>}>
                Route Details
              </ActionButton>
              <ActionButton icon={<AlertTriangle size={20} className="text-gray-500"/>}>
                Report Issue
              </ActionButton>
              <ActionButton icon={<Phone size={20} className="text-gray-500"/>}>
                Contact Support
              </ActionButton>
            </div>

            <div className="pt-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IOSButton 
                  variant="outline" 
                  className="w-full border-red-500/50 text-red-600 hover:bg-red-500/10 shadow-lg" 
                  onClick={controlTracking('stop')}
                >
                  <X className="mr-2" /> Stop Tracking
                </IOSButton>
              </motion.div>
            </div>
          </div>
        </IOSBottomSheetContent>
      </IOSBottomSheet>
    </CommonPageTemplate>
  );
};

export default GPSPage;