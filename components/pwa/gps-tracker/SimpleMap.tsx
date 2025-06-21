'use client';

import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface SimpleMapProps {
  trackPoints: { lat: number; lng: number }[];
}

export default function SimpleMap({ trackPoints }: SimpleMapProps) {
  if (trackPoints.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200/50">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">Start tracking to see your route</p>
          <p className="text-xs text-gray-500 mt-1">Your GPS track will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">GPS Track</span>
        </div>
        <span className="text-xs text-gray-500">{trackPoints.length} points</span>
      </div>
      
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 h-48 overflow-hidden">
        <div className="text-center py-8">
          <MapPin className="h-8 w-8 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Track visualization</p>
          <p className="text-xs text-gray-500 mt-1">{trackPoints.length} GPS points recorded</p>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/40 rounded-lg p-2">
          <div className="text-gray-500">Start</div>
          <div className="font-mono text-gray-700">
            {trackPoints[0]?.lat.toFixed(4)}, {trackPoints[0]?.lng.toFixed(4)}
          </div>
        </div>
        <div className="bg-white/40 rounded-lg p-2">
          <div className="text-gray-500">Current</div>
          <div className="font-mono text-gray-700">
            {trackPoints[trackPoints.length - 1]?.lat.toFixed(4)}, {trackPoints[trackPoints.length - 1]?.lng.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
}
 