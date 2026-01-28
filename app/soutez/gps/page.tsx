'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { GPSLoadingScreen } from "@/components/ui/GPSLoadingScreen";
import { MapPin, ArrowLeft, ArrowRight, Download, BarChart, MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ClientOnly } from "@/components/ui/ClientOnly";


import { useGPSTracking } from "@/hooks/useGPSTracking";
import { IOSStepProgress } from '@/components/ui/ios/step-progress';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from '@/components/ui/ios/button';

// Import GPX utilities
import { convertToGPX, downloadGPX, convertToTrackPoints } from '@/lib/gpx-utils';



// Import GPX Editor dynamically
const DynamicGpxEditor = dynamic(
  () => import('@/components/editor/GpxEditor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }
);

const GPSPage = () => {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPostTracking, setShowPostTracking] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useCurrentUser();
  const currentRole = useCurrentRole();

  // Use custom GPS tracking hook
  const {
    isGPSReady,
    isTracking,
    isPaused,
    currentSession,
    elapsedTime,
    isLoading,

    followPosition,
    lastPositionRef,
    handleGPSReady,
    startTracking,
    controlTracking,
    setFollowPosition,
    formatTime
  } = useGPSTracking();

  // Fullscreen handler
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const mapTrackPoints = currentSession?.positions.map(pos => ({
    lat: pos.latitude,
    lng: pos.longitude
  })) || [];

  // Handle stop tracking
  const handleStopTracking = () => {
    controlTracking('stop')();
    if (currentSession && currentSession.positions.length > 0) {
      setShowPostTracking(true);
    }
  };

  // Handle GPX export
  const handleExportGPX = () => {
    if (!currentSession || currentSession.positions.length === 0) return;

    try {
      const gpxContent = convertToGPX(currentSession, routeName || 'GPS Track');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `gps-track-${timestamp}.gpx`;
      downloadGPX(gpxContent, filename);
    } catch (error) {
      console.error('Failed to export GPX:', error);
      setError('Failed to export GPX file');
    }
  };

  // Handle save and continue to edit
  const handleSave = async () => {
    if (!currentSession || !routeName || !currentUser) return;

    setIsSaving(true);
    setError(null);

    try {
      const trackPoints = convertToTrackPoints(currentSession.positions);

      // Create new VisitData (route)
      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeTitle: routeName,
          routeDescription: routeDescription,
          route: trackPoints,
          routeLink: JSON.stringify(trackPoints),
          visitDate: new Date(),
          points: 0,
          visitedPlaces: "GPS Route",
          dogNotAllowed: "false",
          year: new Date().getFullYear(),
          state: "DRAFT",
          userId: currentUser.id,
          extraPoints: {
            description: routeDescription,
            distance: currentSession.totalDistance,
            totalAscent: currentSession.totalAscent,
            elapsedTime: currentSession.totalTime,
            averageSpeed: currentSession.averageSpeed
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save route');
      }

      const data = await response.json();
      // Navigate to the edit page
      router.push(`/soutez/edit/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  // Post-tracking view
  if (showPostTracking && currentSession) {
    const trackPoints = convertToTrackPoints(currentSession.positions);

    return (
      <CommonPageTemplate currentUser={currentUser} currentRole={currentRole} className="px-6">
        <div className="container mx-auto py-6 space-y-6 max-w-5xl">
          <IOSStepProgress
            steps={['GPS Tracking', 'Náhled trasy', 'Dokončení']}
            currentStep={2}
            className="mb-8"
            stepImages={[
              '/icons/upload.png',
              '/icons/edit.png',
              '/icons/finish.png',
            ]}
          />
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setShowPostTracking(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">GPS Track Complete</h1>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <IOSCard
              title="GPS Track"
              subtitle="Your recorded GPS track with statistics"
              icon={<MapPin className="h-5 w-5" />}
              iconBackground="bg-blue-100"
              iconColor="text-blue-600"
              variant="elevated"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {currentSession.totalDistance.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">km</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatTime(currentSession.totalTime)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">time</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {currentSession.positions.length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">points</div>
                  </div>
                </div>
                <IOSButton
                  variant="outline"
                  onClick={handleExportGPX}
                  className="w-full"
                  icon={<Download className="h-4 w-4" />}
                >
                  Export GPX
                </IOSButton>
              </div>
            </IOSCard>

            <IOSCard
              title="Náhled trasy"
              subtitle="Zkontrolujte nahranou trasu"
              icon={<MapIcon className="h-5 w-5" />}
              iconBackground="bg-green-100"
              iconColor="text-green-600"
              variant="elevated"
            >
              <div className="h-64">
                <DynamicGpxEditor
                  initialTrack={trackPoints}
                  onSave={() => { }}
                  readOnly
                  hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
                />
              </div>
            </IOSCard>
          </div>

          <IOSCard
            title="Základní informace"
            subtitle="Vyplňte základní informace o trase"
            icon={<BarChart className="h-5 w-5" />}
            iconBackground="bg-purple-100"
            iconColor="text-purple-600"
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <IOSTextInput
                  label="Název trasy"
                  placeholder="Zadejte název trasy"
                  value={routeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Popis trasy</label>
                  <IOSTextarea
                    placeholder="Popište svoji trasu, zajímavá místa a zážitky z cesty. Nezapomeňte zmínit zajímavé body, obtížnost a případná omezení..."
                    value={routeDescription}
                    onChange={(value: string) => setRouteDescription(value)}
                  />
                </div>
              </div>
            </div>
          </IOSCard>

          <div className="flex justify-end gap-4">
            <IOSButton
              variant="blue"
              size="lg"
              onClick={handleSave}
              disabled={isSaving || !routeName}
              loading={isSaving}
              icon={<ArrowRight className="h-5 w-5" />}
            >
              Pokračovat na úpravu trasy
            </IOSButton>
          </div>
        </div>
      </CommonPageTemplate>
    );
  }

  // Main GPS tracking view
  return (
    <CommonPageTemplate currentUser={currentUser} currentRole={currentRole} mobileLayout={true} className="p-0 overflow-hidden">
      {!isGPSReady ? (
        <div className="w-full h-full flex items-center justify-center">
          <GPSLoadingScreen onReady={handleGPSReady} />
        </div>
      ) : (
        <motion.div className={cn("w-full h-full", isFullscreen && "fixed inset-0 z-[2000] bg-black/70 flex items-center justify-center")}>
          <motion.div className={cn("w-full h-full", isFullscreen && "max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden")}>
            {/* Map Background */}
            <div className="absolute inset-0 z-0">
              <div className="flex-1 relative">
                <ClientOnly fallback={
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <motion.div className="text-center">
                      <MapPin className="h-16 w-16 text-blue-400 drop-shadow-lg" />
                      <p className="text-sm text-gray-600 mt-4 font-medium">Loading GPS Map...</p>
                    </motion.div>
                  </div>
                }>
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 text-blue-400 drop-shadow-lg" />
                      <p className="text-sm text-gray-600 mt-4 font-medium">GPS Map Component</p>
                    </div>
                  </div>
                </ClientOnly>
              </div>
            </div>

            {/* Status Bar */}
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">GPS Status</span>
                  <IOSButton
                    size="sm"
                    variant="outline"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? 'Exit' : 'Fullscreen'}
                  </IOSButton>
                </div>
              </div>
            </div>

            {/* Live Stats Overlay */}
            <AnimatePresence mode="wait">
              {isTracking && (
                <motion.div
                  className="absolute top-20 left-4 right-4 z-10"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatTime(elapsedTime)}</div>
                        <div className="text-xs text-gray-600">Elapsed Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{currentSession?.positions.length || 0}</div>
                        <div className="text-xs text-gray-600">Track Points</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Control Buttons */}
            <motion.div
              className="absolute bottom-6 left-4 right-4 z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex gap-3 justify-center">
                  {!isTracking ? (
                    <IOSButton
                      size="lg"
                      onClick={startTracking}
                      disabled={isLoading}
                      loading={isLoading}
                    >
                      Start Tracking
                    </IOSButton>
                  ) : (
                    <>
                      {isPaused ? (
                        <IOSButton
                          size="lg"
                          variant="outline"
                          onClick={controlTracking('resume')}
                        >
                          Resume
                        </IOSButton>
                      ) : (
                        <IOSButton
                          size="lg"
                          variant="outline"
                          onClick={controlTracking('pause')}
                        >
                          Pause
                        </IOSButton>
                      )}
                      <IOSButton
                        size="lg"
                        variant="outline"
                        onClick={handleStopTracking}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Stop
                      </IOSButton>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </CommonPageTemplate>
  );
};

export default GPSPage;