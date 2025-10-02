'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Camera, Calendar, Clock, TrendingUp } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSCalendar } from '@/components/ui/ios/calendar';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import dynamic from 'next/dynamic';

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
  const [time, setTime] = useState('0');
  const [difficulty, setDifficulty] = useState('1');
  const [dogNotAllowed, setDogNotAllowed] = useState(false);

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
        const track = data.routeLink ? JSON.parse(data.routeLink) : [];
        
        setRoute({
          id: data.id,
          routeTitle: data.routeTitle,
          routeDescription: data.routeDescription,
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
        setTime(((data.extraPoints?.elapsedTime || 0) / 60).toString());
        setDifficulty((data.extraPoints?.difficulty || 1).toString());
      } catch (err) {
        setError('Failed to load route');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [routeId]);

  const handleSave = async () => {
    if (!route) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/visitData/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitDate: visitDate ? visitDate.toISOString() : new Date().toISOString(),
          dogNotAllowed: dogNotAllowed ? "true" : "false",
          photos: images,
          routeTitle: route.routeTitle,
          routeDescription: route.routeDescription,
          visitedPlaces: "GPS Route",
          routeLink: JSON.stringify(route.track),
          year: visitDate ? visitDate.getFullYear() : new Date().getFullYear(),
          extraPoints: {
            ...route.extraPoints,
            elapsedTime: parseFloat(time) * 60,
            difficulty: parseFloat(difficulty)
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to save route');
      
      // Store in sessionStorage for finish page
      sessionStorage.setItem('routeData', JSON.stringify({
        routeTitle: route.routeTitle,
        routeDescription: route.routeDescription,
        dogNotAllowed: dogNotAllowed ? "true" : "false",
        visitDate: visitDate,
        photos: images,
        extraPoints: {
          ...route.extraPoints,
          elapsedTime: parseFloat(time) * 60,
          difficulty: parseFloat(difficulty)
        }
      }));

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-white text-center py-8">Načítání...</div>;
  }

  if (!route) {
    return <div className="text-white text-center py-8">Trasa nebyla nalezena</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">Upravit trasu</h2>
        <p className="text-sm sm:text-base text-white/90">Přidejte detaily a fotky k vaší trase</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/80 backdrop-blur-xl border-red-500/50 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Map Card */}
      <IOSCard
        title="Mapa trasy"
        subtitle="Zkontrolujte trasu na mapě"
        icon={<MapPin className="h-5 w-5" />}
        iconBackground="bg-green-900/40"
        iconColor="text-green-300"
        variant="elevated"
        className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
        titleClassName="text-white"
        subtitleClassName="text-white/70"
      >
        <div className="h-56 sm:h-80 md:h-96 lg:h-[32rem] xl:h-[40rem]">
          {route.track.length > 0 && (
            <DynamicGpxEditor
              initialTrack={downsampleTrack(route.track)}
              onSave={() => {}}
              readOnly
              hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
            />
          )}
        </div>
      </IOSCard>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Details Card */}
        <IOSCard
          title="Detaily trasy"
          subtitle="Doplňte informace o vaší cestě"
          icon={<Clock className="h-5 w-5" />}
          iconBackground="bg-blue-900/40"
          iconColor="text-blue-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-3 sm:space-y-4">
            <IOSTextInput
              label="Čas (hodiny)"
              placeholder="Např. 2.5"
              value={time}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTime(e.target.value)}
              type="number"
              step="0.1"
              dark
            />
            
            <IOSTextInput
              label="Obtížnost (1-5)"
              placeholder="1"
              value={difficulty}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDifficulty(e.target.value)}
              type="number"
              min="1"
              max="5"
              dark
            />

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-medium text-white/90">Datum absolvování</label>
              <IOSCalendar
                selectedDate={visitDate}
                onDateChange={(date: Date) => setVisitDate(date)}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-white/90">Zákaz vstupu se psy</span>
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
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <EnhancedImageUpload
            sources={images}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            stackingStyle="grid"
            aspectRatio="landscape"
            count={10}
          />
        </IOSCard>
      </div>

      <div className="flex justify-end">
        <IOSButton
          variant="blue"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          loading={isSaving}
          icon={<ArrowRight className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Pokračovat k dokončení
        </IOSButton>
      </div>
    </div>
  );
}
