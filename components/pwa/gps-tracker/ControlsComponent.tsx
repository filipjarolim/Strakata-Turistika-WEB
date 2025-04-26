'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, Pause, PlayCircle, RefreshCcw, Target, Map } from 'lucide-react';
import { ControlsComponentProps } from './types';

const ControlsComponent: React.FC<ControlsComponentProps> = ({
  tracking,
  paused,
  isOffline,
  loading,
  onStartTracking,
  onStopTracking,
  onPauseTracking,
  onResumeTracking,
  onRecenterMap,
  onToggleMapType,
  onResetTracking,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        {!tracking ? (
          <Button
            onClick={onStartTracking}
            disabled={loading || isOffline}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg shadow-sm transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            Start
          </Button>
        ) : (
          <>
            {paused ? (
              <Button
                onClick={onResumeTracking}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg shadow-sm transition-colors"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Resume
              </Button>
            ) : (
              <Button
                onClick={onPauseTracking}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg shadow-sm transition-colors"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}
            <Button
              onClick={onStopTracking}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg shadow-sm transition-colors"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={onRecenterMap}
          disabled={loading}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg shadow-sm transition-colors"
        >
          <Target className="w-5 h-5 mr-2" />
          Recenter
        </Button>
        <Button
          onClick={onToggleMapType}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg shadow-sm transition-colors"
        >
          <Map className="w-5 h-5 mr-2" />
          Map Type
        </Button>
      </div>

      <Button
        onClick={onResetTracking}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg shadow-sm transition-colors"
      >
        <RefreshCcw className="w-5 h-5 mr-2" />
        Reset
      </Button>
    </div>
  );
};

export default ControlsComponent; 