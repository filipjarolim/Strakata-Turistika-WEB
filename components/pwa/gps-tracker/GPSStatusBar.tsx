'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GPSStatusBarProps {
  isOnline: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const GPSStatusBar = ({ 
  isOnline, 
  isFullscreen, 
  onToggleFullscreen 
}: GPSStatusBarProps) => {
  return (
    <motion.div 
      className="absolute top-4 left-4 z-20"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
    >
      <motion.div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-2xl text-sm font-medium shadow-lg",
          isOnline 
            ? "text-green-700 bg-green-100/80 backdrop-blur-xl border border-green-200/50" 
            : "text-red-700 bg-red-100/80 backdrop-blur-xl border border-red-200/50"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div
          animate={{ 
            scale: isOnline ? [1, 1.1, 1] : [1, 0.9, 1],
            opacity: isOnline ? [1, 0.8, 1] : [1, 0.6, 1]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </motion.div>
        <span>{isOnline ? "Online" : "Offline"}</span>
      </motion.div>
    </motion.div>
  );
}; 