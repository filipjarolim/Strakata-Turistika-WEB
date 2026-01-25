'use client';

import React, { useEffect, useState } from 'react';
import { Check, MapPin, BarChart, Calendar, Send, Mountain, Eye, TreeDeciduous, Award, Share2 } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSImageShowcase } from '@/components/ui/ios/image-showcase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Place } from '@/components/soutez/PlacesManager';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

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
  <div className="space-y-1">
    <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">{label}</div>
    <div className="text-lg font-medium text-white break-words drop-shadow-sm">{value || '—'}</div>
  </div>
);

// Helper function to safely render HTML content
const renderHTML = (html: string) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} className="prose prose-invert max-w-none prose-p:text-white/80 prose-p:text-sm prose-p:leading-relaxed break-words" />;
};

export default function FinishStep({ routeId, onComplete, user }: FinishStepProps) {
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogNotAllowed, setDogNotAllowed] = useState('false');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set initial window size for confetti
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    // Fetch route logic...
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
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-white/60 font-medium">Načítám souhrn...</span>
        </div>
      </div>
    );
  }

  if (!route) {
    return <div className="text-white text-center py-8">Trasa nebyla nalezena</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={300}
        gravity={0.15}
        colors={['#3B82F6', '#10B981', '#F59E0B', '#FFFFFF']}
      />

      <div className="text-center mb-10 py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="inline-block"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
            <Check className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 drop-shadow-xl tracking-tight">Skvělá práce!</h2>
          <p className="text-lg text-green-200/80 font-medium">Trasa je připravena k odeslání</p>
        </motion.div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-4 mb-8"
        >
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-200">Něco se nepovedlo</h4>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Scoring Breakdown - Featured */}
      <IOSCard
        title="Bodové hodnocení"
        subtitle="Váš odhadovaný zisk bodů"
        icon={<Award className="h-5 w-5" />}
        iconBackground="bg-yellow-500/20"
        iconColor="text-yellow-300"
        variant="elevated"
        className="bg-black/80 backdrop-blur-xl border border-yellow-500/20 text-white shadow-[0_0_50px_-20px_rgba(234,179,8,0.15)]"
        titleClassName="text-white text-xl"
        subtitleClassName="text-white/60"
      >
        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div className="space-y-1">
              <p className="text-sm text-white/50 uppercase tracking-widest font-semibold">Celkem bodů</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                  {route.extraPoints?.totalPoints?.toFixed(1) || '0'}
                </span>
                <span className="text-xl text-yellow-500/80 font-medium">b</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
              <Award className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Vzdálenost ({route.extraPoints?.distanceKm?.toFixed(1) || '0'} km)</span>
                <span className="font-bold text-green-400">+{route.extraPoints?.distancePoints?.toFixed(1) || '0'} b</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-green-500/50 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Bodovaná místa ({route.extraPoints?.peaks ? route.extraPoints.peaks + route.extraPoints.towers + route.extraPoints.trees + route.extraPoints.others : 0})</span>
                <span className="font-bold text-green-400">+{route.extraPoints?.placePoints?.toFixed(1) || '0'} b</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-blue-500/50 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </IOSCard>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 mt-8">
        {/* Stats Card */}
        <IOSCard
          title="Statistiky trasy"
          subtitle="Přehled výkonu"
          icon={<BarChart className="h-5 w-5" />}
          iconBackground="bg-purple-900/40"
          iconColor="text-purple-300"
          variant="elevated"
          className="bg-black/80 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="grid grid-cols-2 gap-8 py-2">
            <InfoSection
              label="Vzdálenost"
              value={`${route.extraPoints?.distanceKm?.toFixed(2) || '0'} km`}
            />
            <InfoSection
              label="Čas pohybu"
              value={formatDuration(route.extraPoints?.durationMinutes || 0)}
            />
            <InfoSection
              label="Nastoupané metry"
              value={`${route.extraPoints?.peaks ? Math.round(route.extraPoints.peaks * 150) : 0} m`}  // Just an estimate/placeholder or connect real data if available
            />
            <InfoSection
              label="Navštívená místa"
              value={route.places?.length || 0}
            />
          </div>
        </IOSCard>

        {/* Details Card */}
        <IOSCard
          title="Informace o trase"
          subtitle="Detaily zážitku"
          icon={<MapPin className="h-5 w-5" />}
          iconBackground="bg-blue-900/40"
          iconColor="text-blue-300"
          variant="elevated"
          className="bg-black/80 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-6 py-2">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <InfoSection
                  label="Název trasy"
                  value={route.routeTitle}
                />
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-1">Datum</div>
                <div className="text-sm font-medium text-white bg-white/10 px-3 py-1 rounded-full inline-block">
                  {route.visitDate ? new Date(route.visitDate).toLocaleDateString('cs-CZ', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">Popis</div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-white/80 italic leading-relaxed">
                {route.routeDescription ? `"${route.routeDescription}"` : <span className="text-white/30 not-italic">Bez popisu</span>}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">Psi na trase:</div>
              <div className={cn(
                "text-xs font-bold px-3 py-1 rounded-full border",
                dogNotAllowed === "true"
                  ? "bg-red-500/10 text-red-300 border-red-500/20"
                  : "bg-green-500/10 text-green-300 border-green-500/20"
              )}>
                {dogNotAllowed === "true" ? "ZÁKAZ VSTUPU" : "POVOLENO"}
              </div>
            </div>
          </div>
        </IOSCard>
      </div>

      {/* Places */}
      {route.places && route.places.length > 0 && (
        <IOSCard
          title="Bodovaná místa"
          subtitle="Navštívené vrcholy a zajímavosti"
          icon={<Mountain className="h-5 w-5" />}
          iconBackground="bg-green-900/40"
          iconColor="text-green-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white mt-6"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
            {route.places.map((place) => (
              <div key={place.id} className="group border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-black/20 border border-white/5 group-hover:scale-110 transition-transform">
                    {getPlaceTypeIcon(place.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{place.name}</div>
                    <div className="text-xs text-white/50 mb-2">{getPlaceTypeLabel(place.type)}</div>

                    {place.photos && place.photos.length > 0 && (
                      <div className="flex -space-x-2 overflow-hidden py-1">
                        {place.photos.slice(0, 3).map((photo, i) => (
                          <img
                            key={i}
                            src={photo.url}
                            alt=""
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-black object-cover"
                          />
                        ))}
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
          title="Galerie"
          subtitle={`Vzpomínky z cesty (${route.photos.length})`}
          icon={<Calendar className="h-5 w-5" />}
          iconBackground="bg-orange-900/40"
          iconColor="text-orange-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white mt-6"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <IOSImageShowcase images={route.photos} />
        </IOSCard>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 pb-12 border-t border-white/10 mt-12">
        <IOSButton
          variant="outline"
          size="lg"
          onClick={() => onComplete()} // Just go back to home without publishing if needed, or maybe add a "Save as Draft" option?
          disabled={isPublishing}
          className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10"
        >
          Uložit jako koncept
        </IOSButton>

        <IOSButton
          variant="blue"
          size="lg"
          onClick={handlePublish}
          disabled={isPublishing}
          loading={isPublishing}
          icon={<Send className="h-5 w-5" />}
          className="w-full sm:w-auto px-12 h-14 text-lg shadow-xl shadow-blue-600/20 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 border-none"
        >
          Odeslat ke schválení
        </IOSButton>
      </div>
    </div>
  );
}
