'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Route, AlertTriangle, Phone, X, MapPin, Clock, Activity } from 'lucide-react';
import { IOSBottomSheetTitle, IOSBottomSheetDescription } from '@/components/ui/ios/bottom-sheet';
import { IOSButton } from '@/components/ui/ios/button';
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

interface GPSBottomSheetContentProps {
  currentSession: TrackingSession | null;
  elapsedTime: number;
  formatTime: (time: number) => string;
  onStopTracking: () => void;
}

const ActionButton = ({ onClick, children, className = '', icon }: { 
  onClick?: () => void, 
  children: React.ReactNode, 
  className?: string,
  icon?: React.ReactNode
}) => (
  <motion.button 
    onClick={onClick} 
    className={`w-full flex items-center justify-between p-4 rounded-2xl bg-white/90 backdrop-blur-xl hover:bg-white/95 transition-all duration-300 border border-white/50 shadow-lg shadow-black/5 ${className}`}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
  >
    <span className="font-medium text-gray-800">{children}</span>
    <div className="flex items-center gap-2">
      {icon}
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm">
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
    </div>
  </motion.button>
);

export const GPSBottomSheetContent = ({
  currentSession,
  elapsedTime,
  formatTime,
  onStopTracking
}: GPSBottomSheetContentProps) => {
  return (
    <>
      <IOSBottomSheetTitle className="text-xl font-bold mb-2">
        GPS Tracking
      </IOSBottomSheetTitle>
      <IOSBottomSheetDescription className="mb-6">
        View your current tracking session and options.
      </IOSBottomSheetDescription>
      
      <div className="space-y-6 pb-16">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <IOSMiniCard 
            title="Distance" 
            icon={<MapPin size={14}/>} 
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
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
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

        {/* Stop Button */}
        <div className="pt-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <IOSButton 
              variant="outline" 
              className="w-full border-red-500/50 text-red-600 hover:bg-red-500/10 shadow-lg" 
              onClick={onStopTracking}
            >
              <X className="mr-2" /> Stop Tracking
            </IOSButton>
          </motion.div>
        </div>
      </div>
    </>
  );
}; 