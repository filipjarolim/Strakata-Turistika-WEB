'use client';

import React, { useState } from 'react';
import { Upload, MapIcon, MapPin, BarChart, ArrowRight, Watch, FileText, Camera, AlertCircle, Check, Info, Loader2 } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { cn } from "@/lib/utils";
import FormRenderer from "@/components/soutez/FormRenderer";
import { motion } from 'framer-motion';
import { isPhotoWithinTimeLimit } from '@/lib/validation-utils';

interface UploadStepProps {
  onComplete: (routeId: string) => void;
  user: { id: string;[key: string]: unknown };
  userRole?: string;
  initialMode?: 'gpx' | 'manual' | 'gps' | null;
  autoTest?: boolean;
}

export default function UploadStep({ onComplete, user, userRole, initialMode, autoTest }: UploadStepProps) {
  const [uploadMode, setUploadMode] = useState<'gpx' | 'manual' | 'gps' | null>(initialMode || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [visitDate, setVisitDate] = useState<Date>(new Date());
  const [activityType, setActivityType] = useState('WALKING');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trackPoints, setTrackPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [screenshotImages, setScreenshotImages] = useState<{ url: string; public_id: string; title?: string }[]>([]);
  const [extraData, setExtraData] = useState<Record<string, unknown>>({});

  // Auto-test logic
  React.useEffect(() => {
    if (autoTest && uploadMode) {
      if (uploadMode === 'gpx') {
        setRouteName("Testovací GPX Trasa");
        setRouteDescription("Toto je automaticky vygenerovaná testovací trasa pro ověření funkčnosti.");
        const dummyPoints = [{ lat: 50.0755, lng: 14.4378 }, { lat: 50.0760, lng: 14.4380 }, { lat: 50.0765, lng: 14.4385 }];
        setTrackPoints(dummyPoints);
        const dummyFile = new File(["dummy gpx content"], "test-route.gpx", { type: "application/gpx+xml" });
        setSelectedFile(dummyFile);
      } else if (uploadMode === 'manual') {
        setRouteName("Testovací FOTO Trasa");
        setRouteDescription("Toto je automaticky vygenerovaná testovací trasa z fotky.");
        setScreenshotImages([{
          url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=60",
          public_id: "test/dummy-image",
          title: "Test Image"
        }]);
      }
    }
  }, [autoTest, uploadMode]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      try {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const trkpts = Array.from(xmlDoc.getElementsByTagName("trkpt"));
        const points = trkpts.slice(0, 1000).map(p => ({
          lat: parseFloat(p.getAttribute("lat") || "0"),
          lng: parseFloat(p.getAttribute("lon") || "0")
        }));
        setTrackPoints(points);
      } catch (e) {
        setError("Nepodařilo se zpracovat soubor");
      }
    }
  };

  const handleSave = async () => {
    if (!routeName) { setError('Prosím zadejte název trasy'); return; }
    setIsSaving(true);
    try {
      const seasonResponse = await fetch('/api/seasons');
      const seasons = await seasonResponse.json();
      const activeSeason = seasons.find((s: { isActive: boolean }) => s.isActive) || seasons[0];

      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeTitle: routeName,
          routeDescription: routeDescription,
          routeLink: JSON.stringify(trackPoints),
          visitDate: visitDate,
          activityType: activityType,
          userId: user.id,
          seasonId: activeSeason?.id,
          year: activeSeason?.year || new Date().getFullYear(),
          state: 'DRAFT',
          photos: screenshotImages,
          extraData: extraData,
          extraPoints: {
            source: uploadMode === 'gpx' ? 'gpx_upload' : uploadMode === 'gps' ? 'gps_tracking' : 'screenshot'
          }
        }),
      });

      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.message || 'Nepodařilo se uložit trasu');
      }

      const data = await response.json();
      onComplete(data.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Nepodařilo se uložit trasu');
      } else {
        setError('Nepodařilo se uložit trasu');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isDateWarning = !isPhotoWithinTimeLimit(visitDate);

  if (!uploadMode) {
    return (
      <div className="space-y-12 max-w-5xl mx-auto py-12 px-6">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
            ZAČNĚTE <span className="text-white/30">CESTU.</span>
          </h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">REKORDNÍ VÝKON ZAČÍNÁ JEDNÍM NAHRÁNÍM</p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {[
            {
              id: 'gpx',
              icon: FileText,
              title: 'GPX SOUBOR',
              desc: 'PŘÍMÝ IMPORT ZE ZAŘÍZENÍ NEBO APKY',
              color: 'text-blue-400',
              bg: 'bg-blue-400/5'
            },
            {
              id: 'manual',
              icon: Camera,
              title: 'SCREENSHOT',
              desc: 'DOKLAD Z JINÉ APLIKACE (MAPY.CZ, STRAVA)',
              color: 'text-purple-400',
              bg: 'bg-purple-400/5'
            }
          ].map((mode) => (
            <motion.div
              key={mode.id}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUploadMode(mode.id as 'gpx' | 'manual' | 'gps')}
              className="group cursor-pointer p-10 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between min-h-[280px]"
            >
              <div className="space-y-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-2xl", mode.bg)}>
                  <mode.icon className={cn("h-7 w-7", mode.color)} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{mode.title}</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-loose mt-2">{mode.desc}</p>
                </div>
              </div>
              <div className="flex justify-end pr-2">
                <ArrowRight className="w-6 h-6 text-white/10 group-hover:text-white/40 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", uploadMode === 'gpx' ? "bg-blue-400/10" : "bg-purple-400/10")}>
              {uploadMode === 'gpx' ? <Upload className="h-4 w-4 text-blue-400" /> : <Camera className="h-4 w-4 text-purple-400" />}
            </div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">KROK 01: NAHRÁNÍ</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
            {uploadMode === 'gpx' ? 'NAHRÁT ' : 'NAHRÁT '}
            <span className="text-white/30">{uploadMode === 'gpx' ? 'GPX SOUBOR' : 'SCREENSHOT'}</span>
          </h2>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setUploadMode(null);
            setTrackPoints([]);
            setSelectedFile(null);
          }}
          className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-[0.3em] pb-1 border-b border-transparent hover:border-white/20 transition-all italic"
        >
          ZMĚNIT TYP
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {isDateWarning ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-3xl bg-amber-500/5 backdrop-blur-xl border border-amber-500/10 flex items-start gap-4"
            >
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">VAROVÁNÍ: STARÝ DOKLAD</h4>
                <p className="text-[10px] text-amber-200/40 uppercase font-bold tracking-widest leading-loose">
                  TATO NÁVŠTĚVA JE {Math.floor((new Date().getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24))} DNÍ STARÁ (MAX. 14 DNÍ). NEBUDE UZNÁNA!
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-3xl bg-green-500/5 backdrop-blur-xl border border-green-500/10 flex items-center gap-4"
            >
              <Check className="w-5 h-5 text-green-500 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">DATUM V POŘÁDKU</h4>
                <p className="text-[10px] text-green-200/40 uppercase font-bold tracking-widest leading-none">
                  FOTOGRAFIE JE V ČASOVÉM LIMITU
                </p>
              </div>
            </motion.div>
          )}

          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/10 shadow-2xl">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em]">
              ROČNÍK 2025/2026: POVOLENA POUZE CHŮZE
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <FormRenderer
              slug={uploadMode === 'gpx' ? 'gpx-upload' : 'screenshot-upload'}
              stepId="upload"
              values={extraData}
              onChange={setExtraData}
              dark
              context={{
                route: {
                  routeTitle: routeName,
                  routeDescription: routeDescription,
                  track: trackPoints,
                  visitDate: visitDate
                },
                photos: screenshotImages,
                selectedFile: selectedFile,
                onRouteUpdate: (u) => {
                  if (typeof u.routeTitle === 'string') setRouteName(u.routeTitle);
                  if (typeof u.routeDescription === 'string') setRouteDescription(u.routeDescription);
                  if (typeof u.visitDate === 'string' || typeof u.visitDate === 'number' || u.visitDate instanceof Date) setVisitDate(new Date(u.visitDate));
                },
                handleImageUpload: async (file, title) => {
                  const fd = new FormData(); fd.append("file", file); fd.append("title", title);
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  if (!res.ok) throw new Error("Upload failed");
                  const d = await res.json();
                  setScreenshotImages(p => [...p, { url: d.url, public_id: d.public_id, title: d.title }]);
                },
                handleImageDelete: async (id) => setScreenshotImages(p => p.filter(i => i.public_id !== id)),
                handleFileChange: handleFileChange
              }}
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center italic"
              >
                {error}
              </motion.div>
            )}

            <div className="flex justify-end mt-12">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving || !routeName}
                className={cn(
                  "px-12 h-16 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.2em] italic text-sm shadow-2xl",
                  isSaving || !routeName
                    ? "bg-white/5 text-white/10 cursor-not-allowed"
                    : "bg-white text-black hover:bg-slate-200 shadow-white/5"
                )}
              >
                {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <><ArrowRight className="w-5 h-5" /> ULOŽIT A POKRAČOVAT</>}
              </motion.button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Guidelines side card */}
          <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-[2rem] space-y-6 sticky top-24">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">PRAVIDLA</span>
            </div>
            <ul className="space-y-4">
              {[
                'MAXIMÁLNĚ 14 DNÍ OD POŘÍZENÍ',
                'MUSÍ BÝT VIDĚT DATUM A ČAS',
                'TRASA MUSÍ OBSAHOVAT MIN. 2 KM',
                'POUZE PĚŠÍ AKTIVITA'
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-loose">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
