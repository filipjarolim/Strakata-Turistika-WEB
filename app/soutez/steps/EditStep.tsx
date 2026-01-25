'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Camera, Calendar, Clock, TrendingUp, Mountain, Navigation, Info } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSCalendar } from '@/components/ui/ios/calendar';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { IOSImageShowcase } from '@/components/ui/ios/image-showcase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import dynamic from 'next/dynamic';
import PlacesManager, { Place } from '@/components/soutez/PlacesManager';
import { motion } from 'framer-motion';

const DynamicGpxEditor = dynamic(
  () => import('@/components/editor/GpxEditor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-3xl border border-white/10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-white/50">Načítání mapy...</span>
        </div>
      </div>
    )
  }
);

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role: string;
  dogName?: string | null;
}

interface EditStepProps {
  routeId: string;
  onComplete: () => void;
  user: User;
}

interface Route {
  id: string;
  routeTitle: string;
  routeDescription: string;
  routeLink: string;
  track: { lat: number; lng: number }[];
  visitDate: Date | null;
  extraPoints?: {
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    difficulty: number;
  };
}

function downsampleTrack(points: { lat: number; lng: number }[], maxPoints = 1000) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result = [points[0]];
  for (let i = step; i < points.length - step; i += step) {
    result.push(points[i]);
  }
  result.push(points[points.length - 1]);
  return result;
}

export default function EditStep({ routeId, onComplete, user }: EditStepProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageSource[]>([]);
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [dogNotAllowed, setDogNotAllowed] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [manualDistance, setManualDistance] = useState('0');
  const [screenshotImages, setScreenshotImages] = useState<ImageSource[]>([]);

  // Image upload logic
  const handleImageUpload = async (file: File, title: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    setImages((prev) => [...prev, { url: data.url, public_id: data.public_id, title: data.title }]);
  };

  const handleImageDelete = async (public_id: string) => {
    setImages((prev) => prev.filter((img) => img.public_id !== public_id));
  };

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/visitData/${routeId}`);
        if (!response.ok) throw new Error('Failed to fetch route');
        const data = await response.json();

        // Parse route data - can be trackPoints array or legacy format
        let track: { lat: number; lng: number }[] = [];
        if (data.route) {
          try {
            const routeData = typeof data.route === 'string' ? JSON.parse(data.route) : data.route;
            if (routeData.trackPoints && Array.isArray(routeData.trackPoints)) {
              track = routeData.trackPoints.map((p: { latitude?: number; lat?: number; longitude?: number; lng?: number }) => ({
                lat: p.latitude || p.lat || 0,
                lng: p.longitude || p.lng || 0
              }));
            }
          } catch (e) {
            console.warn('Failed to parse route data:', e);
          }
        }

        // Fallback to routeLink if route is empty
        if (track.length === 0 && data.routeLink) {
          try {
            track = JSON.parse(data.routeLink);
          } catch (e) {
            console.warn('Failed to parse routeLink:', e);
          }
        }

        setRoute({
          id: data.id,
          routeTitle: data.routeTitle || '',
          routeDescription: data.routeDescription || '',
          routeLink: data.routeLink || '',
          track: track,
          visitDate: data.visitDate ? new Date(data.visitDate) : null,
          extraPoints: {
            distance: data.extraPoints?.distance || 0,
            totalAscent: data.extraPoints?.totalAscent || 0,
            elapsedTime: data.extraPoints?.elapsedTime || 0,
            difficulty: data.extraPoints?.difficulty || 1
          }
        });

        setVisitDate(data.visitDate ? new Date(data.visitDate) : new Date());
        setDogNotAllowed(data.dogNotAllowed === 'true');
        // Load manual distance from extraPoints.distanceKm or extraPoints.distance
        const savedDistance = data.extraPoints?.distanceKm || data.extraPoints?.distance || 0;
        setManualDistance(savedDistance.toString());

        // Load places if they exist
        if (data.places && Array.isArray(data.places)) {
          setPlaces(data.places);
        }

        // Load photos
        if (data.photos && Array.isArray(data.photos)) {
          setImages(data.photos);
          // Set screenshot images if it's manual mode (no track)
          if (track.length === 0) {
            setScreenshotImages(data.photos);
          }
        }
      } catch (err) {
        console.error('Error fetching route:', err);
        setError('Nepodařilo se načíst trasu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [routeId]);

  const handleSave = async () => {
    if (!route) {
      setError('Trasa nebyla nalezena');
      return;
    }

    // Validation
    if (!visitDate) {
      setError('Prosím vyberte datum návštěvy');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/visitData/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitDate: visitDate.toISOString(),
          dogNotAllowed: dogNotAllowed ? "true" : "false",
          photos: images,
          places: places,
          routeTitle: route.routeTitle || 'Untitled Route',
          routeDescription: route.routeDescription || '',
          // visitedPlaces will be auto-filled from places in API
          routeLink: route.track.length > 0 ? JSON.stringify(route.track) : null,
          year: visitDate.getFullYear(),
          extraPoints: {
            ...route.extraPoints,
            distance: parseFloat(manualDistance) || 0,
            distanceKm: parseFloat(manualDistance) || 0, // Store in km format
            elapsedTime: route.track.length > 0 ? route.extraPoints?.elapsedTime : 0
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save route');
      }

      const updatedData = await response.json();

      // Store in sessionStorage for finish page
      sessionStorage.setItem('routeData', JSON.stringify({
        routeTitle: updatedData.routeTitle,
        routeDescription: updatedData.routeDescription,
        dogNotAllowed: dogNotAllowed ? "true" : "false",
        visitDate: visitDate,
        photos: images,
        places: places,
        extraPoints: {
          ...route.extraPoints,
          distance: parseFloat(manualDistance) || 0
        },
        points: updatedData.points
      }));

      onComplete();
    } catch (err) {
      console.error('Error saving route:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit změny');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-white/60 font-medium">Načítám data trasy...</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return <div className="text-white text-center py-8">Trasa nebyla nalezena</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-8 border-b border-white/10 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20"><Navigation className="h-6 w-6 text-blue-400" /></div>
          Upravit trasu
        </h2>
        <p className="text-sm sm:text-base text-gray-400 pl-[52px]">Přidejte detaily, fotky a zkontrolujte správnost dat.</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-4"
        >
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-200">Něco se nepovedlo</h4>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Map Card or Screenshot Preview */}
      {route.track.length > 0 ? (
        <IOSCard
          title="Mapa trasy"
          subtitle="Zkontrolujte trasu na mapě"
          icon={<MapPin className="h-5 w-5" />}
          iconBackground="bg-green-900/40"
          iconColor="text-green-300"
          variant="elevated"
          className="bg-black/80 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="h-64 sm:h-80 md:h-96 lg:h-[28rem] xl:h-[32rem]">
            <DynamicGpxEditor
              initialTrack={downsampleTrack(route.track)}
              onSave={() => { }}
              readOnly
              hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
            />
          </div>
        </IOSCard>
      ) : screenshotImages.length > 0 && (
        <IOSCard
          title="Screenshot z hodinek"
          subtitle="Náhled nahraných screenshotů"
          icon={<Camera className="h-5 w-5" />}
          iconBackground="bg-green-900/40"
          iconColor="text-green-300"
          variant="elevated"
          className="bg-black/80 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <IOSImageShowcase images={screenshotImages} />
        </IOSCard>
      )}

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Details Card */}
        <IOSCard
          title="Detaily trasy"
          subtitle="Doplňte informace o vaší cestě"
          icon={<Clock className="h-5 w-5" />}
          iconBackground="bg-blue-900/40"
          iconColor="text-blue-300"
          variant="elevated"
          className="bg-black/80 backdrop-blur-xl border border-white/20 text-white h-full"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-6">
            {route.track.length === 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  Vzdálenost (km)
                </label>
                <div className="relative">
                  <IOSTextInput
                    placeholder="- - . -"
                    value={manualDistance}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualDistance(e.target.value)}
                    type="number"
                    step="0.1"
                    dark
                    className="pl-4 pr-12 text-lg font-mono tracking-widest"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-medium">km</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-400" />
                Datum absolvování
              </label>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <IOSCalendar
                  selectedDate={visitDate}
                  onDateChange={(date: Date) => setVisitDate(date)}
                  className="w-full text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-4 px-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
              <div className="space-y-1">
                <span className="text-base font-medium text-white block">Zákaz vstupu se psy</span>
                <span className="text-xs text-white/50 block">Bylo na trase nějaké omezení pro psy?</span>
              </div>
              <IOSSwitch
                checked={dogNotAllowed}
                onCheckedChange={setDogNotAllowed}
              />
            </div>
          </div>
        </IOSCard>

        {/* Photos Card */}
        <IOSCard
          title="Fotografie"
          subtitle="Přidejte fotky z vaší cesty"
          icon={<Camera className="h-5 w-5" />}
          iconBackground="bg-purple-900/40"
          iconColor="text-purple-300"
          variant="elevated"
          className="bg-black/80 backdrop-blur-xl border border-white/20 text-white h-full"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start flex-1">
                <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200">Fotky slouží jako důkaz návštěvy a také pro inspiraci ostatním. Vyberte ty nejlepší!</p>
              </div>
              <div className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-white/70 border border-white/10 ml-4 shrink-0 h-fit">
                MAX 10
              </div>
            </div>

            <EnhancedImageUpload
              sources={images}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              stackingStyle="grid"
              aspectRatio="landscape"
              count={10}
            />
          </div>
        </IOSCard>
      </div>

      {/* Places Card */}
      <IOSCard
        title="Bodovaná místa"
        subtitle="Přidejte vrcholy, rozhledny a další zajímavá místa z vaší cesty"
        icon={<Mountain className="h-5 w-5" />}
        iconBackground="bg-green-900/40"
        iconColor="text-green-300"
        variant="elevated"
        className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
        titleClassName="text-white"
        subtitleClassName="text-white/70"
      >
        <PlacesManager places={places} onChange={setPlaces} dark />
      </IOSCard>

      <div className="flex justify-end pt-4 pb-8">
        <IOSButton
          variant="blue"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          loading={isSaving}
          icon={<ArrowRight className="h-5 w-5" />}
          className="w-full sm:w-auto px-10 h-14 text-lg shadow-xl shadow-blue-500/20"
        >
          Pokračovat k dokončení
        </IOSButton>
      </div>
    </div>
  );
}
