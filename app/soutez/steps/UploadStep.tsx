'use client';

import React, { useState } from 'react';
import { Upload, MapIcon, MapPin, BarChart, ArrowRight, Watch, FileText, Camera, AlertCircle, Check } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { cn } from "@/lib/utils";
import FormRenderer from "@/components/soutez/FormRenderer";
import { motion } from 'framer-motion';

interface UploadStepProps {
  onComplete: (routeId: string) => void;
  user: any;
  userRole?: string;
  initialMode?: 'gpx' | 'manual' | 'gps' | null;
  autoTest?: boolean;
}

export default function UploadStep({ onComplete, user, userRole, initialMode, autoTest }: UploadStepProps) {
  const [uploadMode, setUploadMode] = useState<'gpx' | 'manual' | 'gps' | null>(initialMode || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trackPoints, setTrackPoints] = useState<any[]>([]);
  const [screenshotImages, setScreenshotImages] = useState<any[]>([]);
  const [extraData, setExtraData] = useState<Record<string, unknown>>({});

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
        setError("Failed to parse file");
      }
    }
  };

  const handleSave = async () => {
    if (!routeName) { setError('Prosím zadejte název trasy'); return; }
    setIsSaving(true);
    try {
      const seasonResponse = await fetch('/api/seasons');
      const seasons = await seasonResponse.json();
      const activeSeason = seasons.find((s: any) => s.isActive) || seasons[0];

      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeTitle: routeName,
          routeDescription: routeDescription,
          routeLink: JSON.stringify(trackPoints),
          visitDate: new Date(),
          userId: user.id,
          seasonId: activeSeason?.id,
          state: 'DRAFT',
          photos: screenshotImages,
          extraData: extraData,
          extraPoints: {
            source: uploadMode === 'gpx' ? 'gpx_upload' : uploadMode === 'gps' ? 'gps_tracking' : 'screenshot'
          }
        }),
      });
      const data = await response.json();
      onComplete(data.id);
    } catch (err) {
      setError('Nepodařilo se uložit trasu');
    } finally {
      setIsSaving(false);
    }
  };

  if (!uploadMode) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-10">
        <h2 className="text-3xl font-bold text-white text-center">Jak chcete nahrát trasu?</h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div onClick={() => setUploadMode('gpx')} className="cursor-pointer p-8 rounded-3xl bg-black/80 border border-white/10 hover:border-blue-500/50 transition-all">
            <FileText className="h-10 w-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold text-white">GPX Soubor</h3>
            <p className="text-sm text-gray-400 mt-2">Importujte data přímo ze zařízení.</p>
          </div>
          <div onClick={() => setUploadMode('manual')} className="cursor-pointer p-8 rounded-3xl bg-black/80 border border-white/10 hover:border-purple-500/50 transition-all">
            <Camera className="h-10 w-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-white">Screenshot</h3>
            <p className="text-sm text-gray-400 mt-2">Nahrání fotky z jiné aplikace.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          {uploadMode === 'gpx' ? <Upload className="h-6 w-6 text-blue-400" /> : <Camera className="h-6 w-6 text-purple-400" />}
          {uploadMode === 'gpx' ? 'Nahrát GPX' : 'Nahrát Screenshot'}
        </h2>
        <button onClick={() => {
          setUploadMode(null);
          setTrackPoints([]);
          setSelectedFile(null);
        }} className="text-sm text-white/50 hover:text-white">Změnit typ</button>
      </div>

      <div className="grid gap-8">
        <FormRenderer
          slug={uploadMode === 'gpx' ? 'gpx-upload' : 'screenshot-upload'}
          stepId="upload"
          values={extraData}
          onChange={setExtraData}
          dark
          context={{
            route: { routeTitle: routeName, routeDescription: routeDescription, track: trackPoints },
            photos: screenshotImages,
            selectedFile: selectedFile,
            onRouteUpdate: (u) => {
              if (u.routeTitle !== undefined) setRouteName(u.routeTitle);
              if (u.routeDescription !== undefined) setRouteDescription(u.routeDescription);
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

        <div className="flex justify-end mt-4">
          <IOSButton variant="blue" size="lg" onClick={handleSave} disabled={isSaving || !routeName} loading={isSaving} className="px-12 h-14 shadow-xl">
            Uložit a Pokračovat
          </IOSButton>
        </div>
      </div>
    </div>
  );
}
