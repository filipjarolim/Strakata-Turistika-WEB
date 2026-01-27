'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import FormRenderer from "@/components/soutez/FormRenderer";
import { Check, Send, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FinishStep({ routeId, onComplete, user }: { routeId: string, onComplete: () => void, user: any }) {
  const router = useRouter();
  const [route, setRoute] = useState<any>(null);
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
        <div className="space-y-2">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic">
            SKVĚLÁ <span className="text-white/30">PRÁCE.</span>
          </h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em]">TRASA JE PŘIPRAVENA K ODESLÁNÍ</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-10">
        <div className="pb-8 border-b border-white/5">
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">REKAPITULACE</h3>
          <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">{route?.routeTitle || 'BEZ NÁZVU'}</h4>
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

        <div className="flex flex-col sm:flex-row gap-6 justify-end pt-10 border-t border-white/5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onComplete()}
            className="h-16 px-10 rounded-2xl border border-white/5 bg-white/5 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-all"
          >
            <div className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              ULOŽIT JAKO KONCEPT
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handlePublish}
            disabled={isPublishing}
            className={cn(
              "px-12 h-16 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.2em] italic text-sm shadow-2xl",
              isPublishing
                ? "bg-white/5 text-white/10 cursor-not-allowed"
                : "bg-white text-black hover:bg-slate-200 shadow-white/5"
            )}
          >
            {isPublishing ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> ODESLAT KE SCHVÁLENÍ</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
