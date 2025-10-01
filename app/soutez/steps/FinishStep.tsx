'use client';

import React, { useEffect, useState } from 'react';
import { Check, MapPin, BarChart, Calendar, Send } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSImageShowcase } from '@/components/ui/ios/image-showcase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role: string;
  dogName?: string | null;
}

interface FinishStepProps {
  routeId: string;
  onComplete: () => void;
  user: User;
}

interface Route {
  id: string;
  routeTitle: string;
  routeDescription: string;
  visitDate: Date | null;
  extraPoints?: {
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    difficulty: number;
  };
  photos: { url: string; public_id: string; title: string }[];
}

const InfoSection = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="space-y-1">
    <div className="text-sm text-white/70">{label}</div>
    <div className="text-base font-medium text-white">{value || '—'}</div>
  </div>
);

export default function FinishStep({ routeId, onComplete, user }: FinishStepProps) {
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogNotAllowed, setDogNotAllowed] = useState('false');

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        // First try to get from sessionStorage
        const storedData = sessionStorage.getItem('routeData');
        if (storedData) {
          const data = JSON.parse(storedData);
          setDogNotAllowed(data.dogNotAllowed || 'false');
        }

        const response = await fetch(`/api/visitData/${routeId}`);
        if (!response.ok) throw new Error('Failed to fetch route');
        const data = await response.json();
        
        setRoute({
          id: data.id,
          routeTitle: data.routeTitle,
          routeDescription: data.routeDescription,
          visitDate: data.visitDate ? new Date(data.visitDate) : null,
          extraPoints: {
            distance: data.extraPoints?.distance || 0,
            totalAscent: data.extraPoints?.totalAscent || 0,
            elapsedTime: data.extraPoints?.elapsedTime || 0,
            difficulty: data.extraPoints?.difficulty || 1
          },
          photos: data.photos || []
        });
      } catch (err) {
        setError('Failed to load route');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [routeId]);

  const handlePublish = async () => {
    if (!route) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/visitData/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: 'PUBLISHED'
        }),
      });

      if (!response.ok) throw new Error('Failed to publish route');
      
      // Clear sessionStorage
      sessionStorage.removeItem('routeData');
      
      // Navigate to results
      router.push('/vysledky/moje');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish route');
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return <div className="text-white text-center py-8">Načítání...</div>;
  }

  if (!route) {
    return <div className="text-white text-center py-8">Trasa nebyla nalezena</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Dokončení</h2>
        <p className="text-white/90">Zkontrolujte a odešlete vaši trasu</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/80 backdrop-blur-xl border-red-500/50 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stats Card */}
        <IOSCard
          title="Statistiky trasy"
          subtitle="Přehled základních údajů o trase"
          icon={<BarChart className="h-5 w-5" />}
          iconBackground="bg-purple-900/40"
          iconColor="text-purple-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="grid grid-cols-2 gap-6">
            <InfoSection 
              label="Vzdálenost" 
              value={`${route.extraPoints?.distance?.toFixed(2) || '0'} km`} 
            />
            <InfoSection 
              label="Převýšení" 
              value={`${route.extraPoints?.totalAscent?.toFixed(0) || '0'} m`} 
            />
            <InfoSection 
              label="Čas" 
              value={formatDuration(route.extraPoints?.elapsedTime || 0)} 
            />
            <InfoSection 
              label="Obtížnost" 
              value={`${route.extraPoints?.difficulty || 1}/5`} 
            />
          </div>
        </IOSCard>

        {/* Details Card */}
        <IOSCard
          title="Základní informace"
          subtitle="Detaily o trase"
          icon={<MapPin className="h-5 w-5" />}
          iconBackground="bg-blue-900/40"
          iconColor="text-blue-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-6">
            <InfoSection 
              label="Název trasy" 
              value={route.routeTitle} 
            />
            <InfoSection 
              label="Datum absolvování" 
              value={route.visitDate ? new Date(route.visitDate).toLocaleDateString('cs-CZ', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }) : '—'} 
            />
            <div className="space-y-1">
              <div className="text-sm text-white/70">Popis trasy</div>
              <div className="text-base text-white whitespace-pre-wrap">
                {route.routeDescription || '—'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-white/70">Zákaz vstupu se psy:</div>
              <div className={cn(
                "text-sm font-medium px-2 py-0.5 rounded-full",
                dogNotAllowed === "true" 
                  ? "bg-red-900/40 text-red-300" 
                  : "bg-green-900/40 text-green-300"
              )}>
                {dogNotAllowed === "true" ? "Ano" : "Ne"}
              </div>
            </div>
          </div>
        </IOSCard>
      </div>

      {/* Photos */}
      {route.photos && route.photos.length > 0 && (
        <IOSCard
          title="Fotografie"
          subtitle={`${route.photos.length} ${route.photos.length === 1 ? 'fotka' : route.photos.length < 5 ? 'fotky' : 'fotek'}`}
          icon={<Calendar className="h-5 w-5" />}
          iconBackground="bg-green-900/40"
          iconColor="text-green-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <IOSImageShowcase images={route.photos} />
        </IOSCard>
      )}

      <div className="flex justify-end">
        <IOSButton
          variant="blue"
          size="lg"
          onClick={handlePublish}
          disabled={isPublishing}
          loading={isPublishing}
          icon={<Send className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Odeslat trasu
        </IOSButton>
      </div>
    </div>
  );
}
