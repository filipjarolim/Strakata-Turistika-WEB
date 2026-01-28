'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import FormRenderer from "@/components/soutez/FormRenderer";
import { Check, Send, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

import { User } from 'next-auth'; // Or just define { id: string }
// Better to define locally if global User is not easily available
interface FinishStepUser {
  id: string;
  [key: string]: unknown;
}

export default function FinishStep({ routeId, onComplete, user }: { routeId: string, onComplete: () => void, user: FinishStepUser }) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [route, setRoute] = useState<any>(null); // Keeping any for route as it's complex here and only used for rendering
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [extraData, setExtraData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/visitData/${routeId}`);
        const data = await response.json();
        setRoute(data);
        if (data.extraData) setExtraData(data.extraData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoute();
  }, [routeId]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await fetch(`/api/visitData/${routeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'PENDING_REVIEW' }),
      });
      router.push('/vysledky/moje');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-6">
        <Loader2 className="h-10 w-10 text-white/20 animate-spin" />
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">NAČÍTÁNÍ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto px-6 py-12 pb-32">
      <Confetti recycle={false} numberOfPieces={300} gravity={0.15} colors={['#3b82f6', '#ffffff', '#1e293b']} />

      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto shadow-2xl"
        >
          <Check className="h-10 w-10 text-green-400" />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tight italic">
            Skvělá <span className="text-slate-400 dark:text-white/50">práce.</span>
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-white/50 uppercase tracking-widest">Trasa je připravena k odeslání</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 md:p-10 shadow-xl space-y-8">
        <div className="pb-6 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Rekapitulace</h3>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{route?.routeTitle || 'Bez názvu'}</h4>
        </div>

        <FormRenderer
          slug={
            route?.extraPoints?.source === 'screenshot'
              ? 'screenshot-upload'
              : route?.extraPoints?.source === 'gps_tracking'
                ? 'gps-tracking'
                : 'gpx-upload'
          }
          stepId="finish"
          values={extraData}
          onChange={setExtraData}
          dark
          context={{
            route: route,
            photos: route?.photos,
            places: route?.places
          }}
        />

        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8 border-t border-slate-200 dark:border-white/10">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete()}
            className="h-12 px-8 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Uložit koncept
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePublish}
            disabled={isPublishing}
            className={cn(
              "px-8 h-12 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-lg",
              isPublishing
                ? "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/30 cursor-not-allowed"
                : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 shadow-slate-900/5 dark:shadow-white/5"
            )}
          >
            {isPublishing ? <Loader2 className="animate-spin w-4 h-4" /> : <><Send className="w-4 h-4" /> Odeslat ke schválení</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
