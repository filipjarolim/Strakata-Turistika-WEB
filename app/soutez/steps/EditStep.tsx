'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Navigation, AlertCircle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import FormRenderer from "@/components/soutez/FormRenderer";
import { Place } from '@/components/soutez/PlacesManager';

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
  extraPoints?: { source: string; points: number;[key: string]: unknown };
}

export default function EditStep({ routeId, onComplete, user }: EditStepProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<{ url: string; public_id: string; title?: string }[]>([]);
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [dogNotAllowed, setDogNotAllowed] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [extraData, setExtraData] = useState<Record<string, unknown>>({});

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

        let track: { lat: number; lng: number }[] = [];
        if (data.routeLink) {
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
          extraPoints: data.extraPoints
        });

        setVisitDate(data.visitDate ? new Date(data.visitDate) : new Date());
        setDogNotAllowed(data.dogNotAllowed === 'true');
        if (data.places) setPlaces(data.places);
        if (data.photos) setImages(data.photos);
        if (data.extraData) setExtraData(data.extraData);

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
    if (!route) return;
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/visitData/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitDate: visitDate?.toISOString(),
          dogNotAllowed: dogNotAllowed ? "true" : "false",
          photos: images,
          places: places,
          routeTitle: route.routeTitle || 'Trasa bez názvu',
          routeDescription: route.routeDescription || '',
          extraData: extraData,
          extraPoints: route.extraPoints
        }),
      });

      if (!response.ok) throw new Error('Failed to save route');
      const updatedData = await response.json();

      sessionStorage.setItem('routeData', JSON.stringify({
        routeTitle: updatedData.routeTitle,
        routeDescription: updatedData.routeDescription,
        dogNotAllowed: dogNotAllowed ? "true" : "false",
        visitDate: visitDate,
        photos: images,
        places: places,
        extraPoints: updatedData.extraPoints,
        points: updatedData.points
      }));

      onComplete();
    } catch (err) {
      setError('Nepodařilo se uložit změny');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-6">
        <Loader2 className="h-10 w-10 text-white/20 animate-spin" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">NAČÍTÁNÍ DAT TRASY...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-6 py-10 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-400/10">
              <Navigation className="h-4 w-4 text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-widest">Krok 2: Verifikace</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            Upravit <span className="text-slate-400 dark:text-white/50">detaily trasy.</span>
          </h2>
        </div>
        <p className="max-w-xs text-xs text-slate-500 dark:text-white/40 font-medium leading-relaxed">
          Zkontrolujte správnost dat a přidejte doplňující informace.
        </p>
      </div>

      <div className="grid lg:grid-cols-1 gap-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-3xl bg-red-500/10 backdrop-blur-xl border border-red-500/20 flex items-start gap-4"
          >
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-500">Chyba při ukládání</h4>
              <p className="text-xs text-red-200/60 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          </motion.div>
        )}

        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 md:p-10 shadow-xl">
          <FormRenderer
            slug={
              route?.extraPoints?.source === 'screenshot'
                ? 'screenshot-upload'
                : route?.extraPoints?.source === 'gps_tracking'
                  ? 'gps-tracking'
                  : 'gpx-upload'
            }
            stepId="edit"
            values={extraData}
            onChange={setExtraData}
            dark
            context={{
              route: {
                track: route?.track,
                routeTitle: route?.routeTitle,
                routeDescription: route?.routeDescription,
                visitDate: visitDate,
                dogNotAllowed: dogNotAllowed,
                extraPoints: route?.extraPoints
              },
              photos: images,
              places: places,
              onPhotosChange: setImages,
              onPlacesChange: setPlaces,
              onRouteUpdate: (updates) => {
                const typedUpdates = updates as Record<string, unknown>;
                if (typedUpdates.visitDate) setVisitDate(typedUpdates.visitDate as Date);
                if (typedUpdates.dogNotAllowed !== undefined) setDogNotAllowed(typedUpdates.dogNotAllowed as boolean);
                setRoute(prev => prev ? ({ ...prev, ...typedUpdates }) : null);
              },
              handleImageUpload,
              handleImageDelete
            }}
          />

          <div className="flex justify-end mt-12 pt-8 border-t border-white/5">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "px-8 h-12 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-lg",
                isSaving
                  ? "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/30 cursor-not-allowed"
                  : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 shadow-slate-900/5 dark:shadow-white/5"
              )}
            >
              {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <><ArrowRight className="w-4 h-4" /> Pokračovat k dokončení</>}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
