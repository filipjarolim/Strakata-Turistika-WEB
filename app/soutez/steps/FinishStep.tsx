'use client';

import React, { useEffect, useState } from 'react';
import { Check, MapPin, BarChart, Calendar, Send, Mountain, Eye, TreeDeciduous, Award } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSImageShowcase } from '@/components/ui/ios/image-showcase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Place } from '@/components/soutez/PlacesManager';

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

interface ScoringResult {
  scoringModel: string;
  distanceKm: number;
  distancePoints: number;
  placePoints: number;
  peaks: number;
  towers: number;
  trees: number;
  others: number;
  places: string[];
  totalPoints: number;
  durationMinutes: number;
}

interface Route {
  id: string;
  routeTitle: string;
  routeDescription: string;
  visitDate: Date | null;
  extraPoints?: ScoringResult;
  photos: { url: string; public_id: string; title: string }[];
  places?: Place[];
  points: number;
}

const InfoSection = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="space-y-0.5 sm:space-y-1">
    <div className="text-xs sm:text-sm text-white/70">{label}</div>
    <div className="text-sm sm:text-base font-medium text-white break-words">{value || '—'}</div>
  </div>
);

// Helper function to safely render HTML content
const renderHTML = (html: string) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} className="prose prose-invert max-w-none prose-p:text-white prose-p:text-sm prose-p:whitespace-pre-wrap break-words" />;
};

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
          extraPoints: data.extraPoints,
          photos: data.photos || [],
          places: data.places || [],
          points: data.points || 0
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
    if (!route) {
      setError('Trasa nebyla nalezena');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(`/api/visitData/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: 'PENDING_REVIEW' // Submit for admin review
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit route for review');
      }

      // Clear sessionStorage
      sessionStorage.removeItem('routeData');
      
      // Navigate to results with success message
      router.push('/vysledky/moje');
    } catch (err) {
      console.error('Error publishing route:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se odeslat trasu. Zkuste to prosím znovu.');
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getPlaceTypeIcon = (type: string) => {
    switch (type) {
      case 'PEAK':
        return <Mountain className="h-4 w-4 text-blue-400" />;
      case 'TOWER':
        return <Eye className="h-4 w-4 text-purple-400" />;
      case 'TREE':
        return <TreeDeciduous className="h-4 w-4 text-green-400" />;
      default:
        return <MapPin className="h-4 w-4 text-orange-400" />;
    }
  };

  const getPlaceTypeLabel = (type: string) => {
    switch (type) {
      case 'PEAK':
        return 'Vrchol';
      case 'TOWER':
        return 'Rozhledna';
      case 'TREE':
        return 'Strom';
      default:
        return 'Jiné';
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
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">Dokončení</h2>
        <p className="text-sm sm:text-base text-white/90">Zkontrolujte a odešlete vaši trasu</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/80 backdrop-blur-xl border-red-500/50 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Scoring Breakdown */}
      <IOSCard
        title="Bodové hodnocení"
        subtitle="Přehled bodového hodnocení trasy"
        icon={<Award className="h-5 w-5" />}
        iconBackground="bg-yellow-900/40"
        iconColor="text-yellow-300"
        variant="elevated"
        className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
        titleClassName="text-white"
        subtitleClassName="text-white/70"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-white/70">Vzdálenost</div>
              <div className="text-lg font-semibold text-white">
                {route.extraPoints?.distanceKm?.toFixed(2) || '0'} km
              </div>
              <div className="text-sm text-green-400">
                +{route.extraPoints?.distancePoints?.toFixed(1) || '0'} bodů
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-white/70">Čas</div>
              <div className="text-lg font-semibold text-white">
                {formatDuration(route.extraPoints?.durationMinutes || 0)}
              </div>
            </div>
          </div>

          {route.extraPoints && (route.extraPoints.peaks + route.extraPoints.towers + route.extraPoints.trees + route.extraPoints.others) > 0 && (
            <div className="border-t border-white/10 pt-4">
              <div className="text-sm text-white/70 mb-3">Bodovaná místa</div>
              <div className="grid grid-cols-2 gap-3">
                {route.extraPoints.peaks > 0 && (
                  <div className="flex items-center gap-2">
                    <Mountain className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-white/90">{route.extraPoints.peaks}× Vrchol</span>
                  </div>
                )}
                {route.extraPoints.towers > 0 && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-white/90">{route.extraPoints.towers}× Rozhledna</span>
                  </div>
                )}
                {route.extraPoints.trees > 0 && (
                  <div className="flex items-center gap-2">
                    <TreeDeciduous className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-white/90">{route.extraPoints.trees}× Strom</span>
                  </div>
                )}
                {route.extraPoints.others > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-white/90">{route.extraPoints.others}× Jiné</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-green-400 mt-3">
                +{route.extraPoints?.placePoints?.toFixed(1) || '0'} bodů
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-white">Celkem</span>
              <span className="text-2xl font-bold text-yellow-400">
                {route.extraPoints?.totalPoints?.toFixed(1) || '0'} bodů
              </span>
            </div>
          </div>
        </div>
      </IOSCard>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
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
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <InfoSection 
              label="Vzdálenost" 
              value={`${route.extraPoints?.distanceKm?.toFixed(2) || '0'} km`} 
            />
            <InfoSection 
              label="Čas" 
              value={formatDuration(route.extraPoints?.durationMinutes || 0)} 
            />
            <InfoSection 
              label="Body" 
              value={`${route.extraPoints?.totalPoints?.toFixed(1) || '0'} bodů`} 
            />
            <InfoSection 
              label="Místa" 
              value={route.places?.length || 0} 
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
          <div className="space-y-4 sm:space-y-6">
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
              <div className="text-xs sm:text-sm text-white/70">Popis trasy</div>
              {route.routeDescription ? renderHTML(route.routeDescription) : '—'}
            </div>
            <div className="flex flex-wrap items-center gap-2">
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

      {/* Places */}
      {route.places && route.places.length > 0 && (
        <IOSCard
          title="Bodovaná místa"
          subtitle={`${route.places.length} ${route.places.length === 1 ? 'místo' : route.places.length < 5 ? 'místa' : 'míst'}`}
          icon={<Mountain className="h-5 w-5" />}
          iconBackground="bg-green-900/40"
          iconColor="text-green-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-3">
            {route.places.map((place) => (
              <div key={place.id} className="border border-white/10 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPlaceTypeIcon(place.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{place.name}</span>
                      <span className="text-xs text-white/50">{getPlaceTypeLabel(place.type)}</span>
                    </div>
                    {place.description && (
                      <div className="text-sm text-white/70 mb-2">
                        {renderHTML(place.description)}
                      </div>
                    )}
                    {place.photos && place.photos.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {place.photos.slice(0, 3).map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.url}
                            alt={photo.title || place.name}
                            className="h-16 w-16 object-cover rounded-md border border-white/10"
                          />
                        ))}
                        {place.photos.length > 3 && (
                          <div className="h-16 w-16 rounded-md border border-white/10 flex items-center justify-center bg-white/5 text-xs text-white/50">
                            +{place.photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </IOSCard>
      )}

      {/* Photos */}
      {route.photos && route.photos.length > 0 && (
        <IOSCard
          title="Fotografie"
          subtitle={`${route.photos.length} ${route.photos.length === 1 ? 'fotka' : route.photos.length < 5 ? 'fotky' : 'fotek'}`}
          icon={<Calendar className="h-5 w-5" />}
          iconBackground="bg-orange-900/40"
          iconColor="text-orange-300"
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
