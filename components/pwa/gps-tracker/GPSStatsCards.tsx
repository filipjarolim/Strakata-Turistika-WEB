'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Navigation, Clock, Activity } from 'lucide-react';
import { IOSMiniCard } from '@/components/ui/ios/mini-card';

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
    deviceInfo: {
      userAgent: string;
      platform: string;
      language: string;
      timezone: string;
      screenResolution: string;
      connectionType?: string;
    };
    weatherData?: Record<string, unknown>;
    batteryLevel?: number;
    isCharging?: boolean;
    networkType?: string;
  };
  syncStatus: 'pending' | 'synced' | 'failed';
  version: string;
}

interface GPSStatsCardsProps {
  currentSession: TrackingSession | null;
  elapsedTime: number;
  formatTime: (time: number) => string;
}

export const GPSStatsCards = ({ currentSession, elapsedTime, formatTime }: GPSStatsCardsProps) => {
  return (
    <motion.div 
      className="grid grid-cols-3 gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
    >
      <IOSMiniCard 
        title="Distance" 
        icon={<Navigation size={14}/>} 
        value={currentSession?.totalDistance.toFixed(2) || '0.00'} 
        unit="km"
        variant="highlight"
      />
      <IOSMiniCard 
        title="Time" 
        icon={<Clock size={14}/>} 
        value={formatTime(elapsedTime || currentSession?.totalTime || 0)} 
        unit=""
        variant="default"
      />
      <IOSMiniCard 
        title="Speed" 
        icon={<Activity size={14}/>} 
        value={currentSession?.averageSpeed.toFixed(1) || '0.0'} 
        unit="km/h"
        variant="subtle"
      />
    </motion.div>
  );
}; 