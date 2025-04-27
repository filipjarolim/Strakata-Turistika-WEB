'use client';

import React from 'react';
import { Clock, MapPin, Activity } from 'lucide-react';

interface LogEntry {
  timestamp: number;
  distance: string;
  speed: number;
  position: [number, number];
}

interface LogConsoleProps {
  logs: LogEntry[];
  className?: string;
}

const LogConsole: React.FC<LogConsoleProps> = ({ logs, className = '' }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 space-y-2 max-h-[200px] overflow-y-auto ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tracking Log</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">No logs yet</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div 
              key={index} 
              className="bg-white p-2 rounded-md shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{formatTime(log.timestamp)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-gray-700">{log.distance} km</span>
                <span className="text-gray-500">({log.speed.toFixed(1)} km/h)</span>
              </div>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">
                  {log.position[0].toFixed(6)}, {log.position[1].toFixed(6)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogConsole; 