'use client';

import React from 'react';
import { StatsComponentProps } from './types';

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
    : `${pad(minutes)}:${pad(remainingSeconds)}`;
};

const StatsComponent: React.FC<StatsComponentProps> = ({
  distance,
  elapsedTime,
  speed,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
        <p className="text-xs text-gray-500">Distance</p>
        <p className="text-lg font-bold text-gray-800">{distance} km</p>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
        <p className="text-xs text-gray-500">Time</p>
        <p className="text-lg font-bold text-gray-800">{formatTime(elapsedTime)}</p>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg shadow-sm">
        <p className="text-xs text-gray-500">Speed</p>
        <p className="text-lg font-bold text-gray-800">{speed.toFixed(1)} km/h</p>
      </div>
    </div>
  );
};

export default StatsComponent; 