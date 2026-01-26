'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Navigation, AlertCircle } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { AlertCircle as AlertIcon } from "lucide-react";
import FormRenderer from "@/components/soutez/FormRenderer";
import { motion } from 'framer-motion';

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
  extraPoints?: any;
}

export default function EditStep({ routeId, onComplete, user }: EditStepProps) {
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [dogNotAllowed, setDogNotAllowed] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
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
          routeTitle: route.routeTitle || 'Untitled Route',
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

  if (isLoading) return <div className="p-20 text-center text-white/50">Načítám...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="border-b border-white/10 pb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <Navigation className="h-6 w-6 text-blue-400" />
          Upravit trasu
        </h2>
        <p className="text-gray-400 mt-2">Přidejte detaily, fotky a zkontrolujte správnost dat.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200 text-sm flex gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </motion.div>
      )}

      <div className="grid gap-8 grid-cols-1">
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
              if (updates.visitDate) setVisitDate(updates.visitDate);
              if (updates.dogNotAllowed !== undefined) setDogNotAllowed(updates.dogNotAllowed);
              setRoute(prev => prev ? ({ ...prev, ...updates }) : null);
            },
            handleImageUpload,
            handleImageDelete
          }}
        />
      </div>

      <div className="flex justify-end pt-8">
        <IOSButton
          variant="blue"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          loading={isSaving}
          icon={<ArrowRight className="h-5 w-5" />}
          className="w-full sm:w-auto px-10 h-14 text-lg shadow-xl shadow-blue-500/30"
        >
          Pokračovat k dokončení
        </IOSButton>
      </div>
    </div>
  );
}
