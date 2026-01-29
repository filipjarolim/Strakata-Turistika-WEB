"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Map,
  Camera,
  ExternalLink,
  Award,
  Users,
  Route,
  TrendingUp,
  Clock,
  Image as ImageIcon,
  X,
  Share2,
  Calendar,
  User,
  Edit,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';
import { deleteVisit, updateVisit } from "@/actions/visit-actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { VisitDataWithUser } from '@/lib/results-utils';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { RoutePreviewSVG } from './RoutePreviewSVG';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamic Map
const VisitDetailMap = dynamic(() => import('./VisitDetailMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-white/5 flex items-center justify-center text-gray-400">Načítání mapy...</div>
});

interface VisitDetailSheetProps {
  visit: VisitDataWithUser | null;
  open: boolean;
  onClose: () => void;
}

interface FullVisitData extends VisitDataWithUser {
  photos?: Array<{ url: string; public_id: string; title?: string }>;
  places?: Array<{ id: string; name: string; type: string; description?: string; photos?: Array<{ id: string; url: string; title?: string }> }>;
  routeDescription?: string;
}

export function VisitDetailSheet({ visit, open, onClose }: VisitDetailSheetProps) {
  const [fullVisitData, setFullVisitData] = useState<FullVisitData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'map' | 'photos'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState<string>('');

  useEffect(() => {
    if (visit?.visitDate) {
      // Format to YYYY-MM-DD for input type="date"
      try {
        const d = new Date(visit.visitDate);
        setEditDate(d.toISOString().split('T')[0]);
      } catch (e) {
        setEditDate('');
      }
    }
  }, [visit]);

  const handleSave = async () => {
    if (!visit) return;

    if (!editDate) {
      toast.error("Datum nesmí být prázdné");
      return;
    }

    const result = await updateVisit(visit.id, { visitDate: new Date(editDate) });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Uloženo");
      setIsEditing(false);
      onClose(); // Close to refresh data or force reload
      // Ideally we should update local state but revalidatePath is server side.
      // A simple window reload or context refresh might be needed if we don't want to close.
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!visit) return;
    if (confirm("Opravdu chcete smazat tento záznam?")) {
      const result = await deleteVisit(visit.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Smazáno");
        onClose();
      }
    }
  };

  // Load detailed data
  useEffect(() => {
    if (open && visit) {
      setActiveTab('info');
      setIsLoading(true);
      setFullVisitData(null); // Reset

      // Fetch logic matching original
      const year = visit.year || new Date().getFullYear();
      fetch(`/api/results/${year}/${visit.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setFullVisitData(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [open, visit]);

  if (!visit) return null;

  // Merge data: prefer full detail if available
  const displayVisit = (fullVisitData || visit) as FullVisitData;
  const photos = displayVisit.photos || [];
  const route = displayVisit.route;
  const hasRoute = route && route.trackPoints && route.trackPoints.length > 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extraPoints: any = displayVisit.extraPoints || {};

  // Hero Logic
  const renderHero = () => {
    // Priority 1: First Photo
    if (photos.length > 0) {
      return (
        <div className="relative w-full h-56 sm:h-80 bg-gray-100 dark:bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[0].url}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 hidden dark:block" />
        </div>
      );
    }

    // Priority 3: Fallback (No Map, No Photos)
    return (
      <div className="relative w-full h-56 sm:h-80 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 overflow-hidden">
        <Image
          src="/images/misc/no-preview.png"
          alt="Náhled není k dispozici"
          fill
          className="object-cover opacity-80"
          unoptimized
          priority
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-3 py-1.5 bg-white/90 dark:bg-black/80 backdrop-blur rounded-lg text-xs font-semibold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 shadow-sm">
            Bez náhledu
          </span>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:h-[85vh] p-0 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white backdrop-blur-3xl shadow-2xl rounded-t-[30px] overflow-hidden [&>button]:hidden"
      >
        {/* Close Button & Header Actions */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button className="p-2 rounded-full bg-white/50 dark:bg-black/40 text-black dark:text-white backdrop-blur hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm">
            <Share2 className="w-4 h-4" />
          </button>
          <SheetClose className="p-2 rounded-full bg-white/50 dark:bg-black/40 text-black dark:text-white backdrop-blur hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm">
            <X className="w-4 h-4" />
          </SheetClose>
        </div>

        {/* Actions Bar */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-full bg-white/50 dark:bg-black/40 text-black dark:text-white backdrop-blur hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm"
              title="Upravit"
            >
              <Edit className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="p-2 rounded-full bg-green-500/80 text-white backdrop-blur hover:bg-green-600 transition-colors shadow-sm"
                title="Uložit"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-full bg-gray-500/80 text-white backdrop-blur hover:bg-gray-600 transition-colors shadow-sm"
                title="Zrušit"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-red-500/80 text-white backdrop-blur hover:bg-red-600 transition-colors shadow-sm"
                title="Smazat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col h-full">
          {/* Hero Header */}
          <div className="relative shrink-0">
            {renderHero()}

            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-white/80 dark:via-[#0a0a0a]/80 to-transparent pt-20">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide backdrop-blur-md">
                  {visit.points} bodů
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/50 dark:bg-white/10 border border-black/5 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-medium backdrop-blur-md flex items-center gap-1.5 shadow-sm">
                  <Calendar className="w-3 h-3" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-2 py-0.5 rounded border border-gray-300 text-xs text-black"
                    />
                  ) : (
                    <>
                      {visit.visitDate ? format(new Date(visit.visitDate), "d. MMMM yyyy", { locale: cs }) : 'N/A'}
                    </>
                  )}
                </span>
              </div>
              <SheetTitle className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-sm">
                {visit.routeTitle || 'Neznámá trasa'}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-300 text-sm font-medium">
                <User className="w-4 h-4" />
                {visit.displayName}
                {visit.user?.dogName && (
                  <>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    <DogIcon />
                    {visit.user.dogName}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-2 mx-6 mt-4 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shrink-0">
            {[
              { id: 'info', label: 'Informace', icon: Award },
              { id: 'map', label: 'Mapa', icon: Map },
              { id: 'photos', label: 'Galerie', icon: Camera, count: photos.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'info' | 'map' | 'photos')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-white dark:bg-blue-600 text-black dark:text-white shadow-md dark:shadow-lg dark:shadow-blue-900/20"
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 text-[10px] bg-gray-200 dark:bg-white/20 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-6 pb-6 mt-4">
            <AnimatePresence mode="wait">
              {/* INFO TAB */}
              {activeTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8 pb-10"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    <StatBox label="Vzdálenost" value={`${extraPoints.distanceKm?.toFixed(1) || '-'} km`} icon={TrendingUp} />
                    <StatBox label="Doba trvání" value={formatDuration(extraPoints.durationMinutes)} icon={Clock} />
                    <StatBox label="Převýšení" value={`${extraPoints.elevation || '-'} m`} icon={TrendingUp} /> {/* Mock */}
                    <StatBox label="Místa" value={visit.visitedPlaces.split(',').length} icon={Route} />
                  </div>

                  {/* Description */}
                  {(displayVisit.routeDescription) && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <div className="w-1 h-6 bg-blue-500 rounded-full" />
                        Popis trasy
                      </h3>
                      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                        {displayVisit.routeDescription}
                      </div>
                    </div>
                  )}

                  {/* Places */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-purple-500 rounded-full" />
                      Navštívená místa
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {visit.visitedPlaces.split(',').map((place, i) => (
                        <div key={i} className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                          {place.trim()}
                        </div>
                      ))}
                    </div>
                  </div>

                  {visit.routeLink && (
                    <a href={visit.routeLink} target="_blank" rel="noreferrer" className="block p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-center font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                      Otevřít trasu na Mapy.cz
                    </a>
                  )}
                </motion.div>
              )}

              {/* MAP TAB */}
              {activeTab === 'map' && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[300px] sm:h-[400px] bg-gray-100 dark:bg-white/5 rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10"
                >
                  {hasRoute ? (
                    <VisitDetailMap visit={displayVisit} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                      <Map className="w-10 h-10 opacity-30" />
                      <p>Mapová data nejsou k dispozici.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PHOTOS TAB */}
              {activeTab === 'photos' && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {photos.length > 0 ? photos.map((photo, i) => (
                    <div key={i} className="aspect-square relative rounded-xl overflow-hidden group cursor-pointer border border-gray-200 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="Gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-20 text-center text-gray-500">
                      Žádné fotky k dispozici
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helpers
interface StatBoxProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
}

const StatBox = ({ label, value, icon: Icon }: StatBoxProps) => (
  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-xs text-gray-500 uppercase tracking-wider font-bold">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <div className="text-lg font-black text-gray-900 dark:text-white truncate">
      {value}
    </div>
  </div>
);

const formatDuration = (mins?: number) => {
  if (!mins) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

// Simple User Icon replacement to avoid big imports if needed, or stick to Lucide
const UserIcon = ({ className }: { className?: string }) => (
  <div className={cn("w-8 h-8 rounded-full bg-gray-700", className)} />
);

// Dog Icon Helper
const DogIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" /><path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5" /><path d="M8 14v.5" /><path d="M16 14v.5" /><path d="M11.25 16.25h1.5L12 17l-.75-.75Z" /><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.5c0 3.314 2.686 6 6 6s6-2.686 6-6c0-1.657-.67-3.16-1.764-4.253" /></svg>
);
