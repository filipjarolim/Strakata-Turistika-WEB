'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square } from 'lucide-react';
import { IOSFloatingActionButton } from '@/components/ui/ios/floating-action-button';

interface GPSControlButtonsProps {
  isTracking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  onStartTracking: () => void;
  onPauseTracking: () => void;
  onResumeTracking: () => void;
  onStopTracking: () => void;
}

export const GPSControlButtons = ({
  isTracking,
  isPaused,
  isLoading,
  onStartTracking,
  onPauseTracking,
  onResumeTracking,
  onStopTracking
}: GPSControlButtonsProps) => {
  if (!isTracking) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
        className="flex justify-center"
      >
        <IOSFloatingActionButton
          size="lg"
          variant="primary"
          onClick={onStartTracking}
          loading={isLoading}
          className="text-white"
        >
          <Play className="h-8 w-8" />
        </IOSFloatingActionButton>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="flex items-center justify-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <AnimatePresence mode="wait">
        {isPaused ? (
          <motion.div
            key="resume"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <IOSFloatingActionButton
              size="md"
              variant="primary"
              onClick={onResumeTracking}
              className="text-white"
            >
              <Play className="h-6 w-6" />
            </IOSFloatingActionButton>
          </motion.div>
        ) : (
          <motion.div
            key="pause"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <IOSFloatingActionButton
              size="md"
              variant="secondary"
              onClick={onPauseTracking}
            >
              <Pause className="h-6 w-6 text-gray-700" />
            </IOSFloatingActionButton>
          </motion.div>
        )}
      </AnimatePresence>
      
      <IOSFloatingActionButton
        size="md"
        variant="danger"
        onClick={onStopTracking}
        className="text-white"
      >
        <Square className="h-6 w-6" />
      </IOSFloatingActionButton>
    </motion.div>
  );
}; 