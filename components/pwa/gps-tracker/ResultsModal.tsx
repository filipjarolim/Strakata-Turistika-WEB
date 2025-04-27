'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ResultsModalProps } from './types';
import { Loader2, DownloadCloud } from 'lucide-react';

const ResultsModal: React.FC<ResultsModalProps> = ({
  showResults,
  mapImage,
  distance,
  elapsedTime,
  avgSpeed,
  maxSpeed,
  isSaving,
  saveSuccess,
  onClose,
  onFinish,
  onReset,
  className = ''
}) => {
  if (!showResults) return null;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`
      : `${pad(minutes)}:${pad(remainingSeconds)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`max-w-2xl w-full mx-4 ${className}`}>
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Track Summary</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Distance</p>
                <p className="text-xl font-bold text-gray-800">{distance} km</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-xl font-bold text-gray-800">{formatTime(elapsedTime)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Average Speed</p>
                <p className="text-xl font-bold text-gray-800">{avgSpeed} km/h</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Max Speed</p>
                <p className="text-xl font-bold text-gray-800">{maxSpeed.toFixed(1)} km/h</p>
              </div>
            </div>

            {mapImage && (
              <div className="mb-6">
                <Image
                  src={mapImage}
                  alt="Mapa trasy"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                onClick={onReset}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg shadow-sm transition-colors"
              >
                Reset
              </Button>
              <Button
                onClick={onFinish}
                disabled={isSaving}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow-sm transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-5 h-5 mr-2" />
                    Save Track
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal; 