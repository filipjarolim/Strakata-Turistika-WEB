'use client';

import React, { useEffect, useState } from 'react';
import { Check, Send } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { useRouter } from 'next/navigation';
import FormRenderer from "@/components/soutez/FormRenderer";
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';

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

  if (isLoading) return <div className="p-20 text-center text-white/50">Načítám...</div>;

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <Confetti recycle={false} numberOfPieces={300} gravity={0.15} />

      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-green-400" />
        </div>
        <h2 className="text-4xl font-black text-white mb-2">Skvělá práce!</h2>
        <p className="text-lg text-green-200/80">Trasa je připravena k odeslání</p>
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

      <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8">
        <IOSButton variant="outline" size="lg" onClick={() => onComplete()} className="border-white/20 text-white">
          Uložit jako koncept
        </IOSButton>

        <IOSButton
          variant="blue"
          size="lg"
          onClick={handlePublish}
          disabled={isPublishing}
          loading={isPublishing}
          icon={<Send className="h-5 w-5" />}
          className="px-12 h-14 text-lg bg-gradient-to-r from-blue-600 to-blue-500 border-none shadow-xl"
        >
          Odeslat ke schválení
        </IOSButton>
      </div>
    </div>
  );
}
