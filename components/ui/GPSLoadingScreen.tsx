'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Loader2
} from "lucide-react";

interface GPSLoadingScreenProps {
  onReady: () => void;
}

export const GPSLoadingScreen: React.FC<GPSLoadingScreenProps> = ({ onReady }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [canSkip, setCanSkip] = useState(false);
  const [skipTimer, setSkipTimer] = useState(3);

  // Skip timer (client only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (skipTimer > 0) {
      const timer = setTimeout(() => {
        setSkipTimer(skipTimer - 1);
        if (skipTimer === 1) {
          setCanSkip(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [skipTimer]);

  // Simple GPS loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onReady();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onReady]);

  const handleSkip = () => {
    setIsLoading(false);
    onReady();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          <div className="p-4 rounded-full bg-blue-100 w-fit mx-auto">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">GPS Sledování</h2>
            <p className="text-sm text-gray-600">Načítání GPS...</p>
          </div>
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          {canSkip && (
            <Button onClick={handleSkip} variant="outline" className="w-full">
              Přeskočit
            </Button>
          )}
          {!canSkip && skipTimer > 0 && (
            <p className="text-xs text-gray-500">
              Přeskočit za {skipTimer} sekund
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 