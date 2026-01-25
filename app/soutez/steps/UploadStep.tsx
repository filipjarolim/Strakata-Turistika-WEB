'use client';

import React, { useState } from 'react';
import { Upload, MapIcon, MapPin, BarChart, ArrowRight, Watch, FileText, Camera, AlertCircle, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSButton } from '@/components/ui/ios/button';
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import DynamicFormFields from "@/components/soutez/DynamicFormFields";
import { motion, AnimatePresence } from 'framer-motion';

const DynamicGpxEditor = dynamic(
  () => import('@/components/editor/GpxEditor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-white/50">Načítání editoru...</span>
        </div>
      </div>
    )
  }
);

interface Point {
  lat: number;
  lng: number;
}

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  role: string;
  dogName?: string | null;
}

interface UploadStepProps {
  onComplete: (routeId: string) => void;
  user: User;
}

type UploadMode = 'gpx' | 'manual';

function downsampleTrack(points: Point[], maxPoints = 1000): Point[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const result: Point[] = [points[0]];
  for (let i = step; i < points.length - step; i += step) {
    result.push(points[i]);
  }
  result.push(points[points.length - 1]);
  return result;
}

export default function UploadStep({ onComplete, user }: UploadStepProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trackPoints, setTrackPoints] = useState<Point[]>([]);

  // Manual mode fields
  const [screenshotImages, setScreenshotImages] = useState<ImageSource[]>([]);

  // Dynamic form fields
  const [extraData, setExtraData] = useState<Record<string, unknown>>({});

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const supportedFormats = ['.gpx', '.kml', '.kmz', '.tcx', '.fit', '.nmea', '.csv', '.geojson'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (supportedFormats.includes(fileExtension)) {
        setSelectedFile(file);
        setError(null);

        try {
          if (typeof window === 'undefined') {
            throw new Error('Cannot parse file in non-browser environment');
          }

          let points: Point[] = [];
          const text = await file.text();
          const parser = new DOMParser();

          switch (fileExtension) {
            case '.gpx':
              const xmlDoc = parser.parseFromString(text, "text/xml");
              const parserError = xmlDoc.querySelector('parsererror');
              if (parserError) {
                throw new Error('Invalid GPX file format');
              }
              const trackpoints = Array.from(xmlDoc.getElementsByTagName("trkpt"));
              points = trackpoints.map(point => {
                const lat = point.getAttribute("lat");
                const lon = point.getAttribute("lon");
                if (!lat || !lon) {
                  throw new Error('Invalid trackpoint data');
                }
                return {
                  lat: parseFloat(lat),
                  lng: parseFloat(lon)
                };
              });
              break;

            case '.kml':
              const kmlDoc = parser.parseFromString(text, "text/xml");
              const coordinates = Array.from(kmlDoc.getElementsByTagName("coordinates"));
              points = coordinates.flatMap(coord => {
                const coordText = coord.textContent?.trim() || '';
                return coordText.split(/\s+/).map(point => {
                  const [lng, lat] = point.split(',').map(Number);
                  return { lat, lng };
                });
              });
              break;

            case '.geojson':
              const geojson = JSON.parse(text);
              if (geojson.type === 'Feature') {
                if (geojson.geometry.type === 'LineString') {
                  points = geojson.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
                    lat,
                    lng
                  }));
                }
              }
              break;

            default:
              throw new Error(`Support for ${fileExtension.toUpperCase()} files coming soon!`);
          }

          if (points.length === 0) {
            throw new Error('No trackpoints found in file');
          }

          const downsampledPoints = downsampleTrack(points);
          setTrackPoints(downsampledPoints);
        } catch (err) {
          console.error('File parsing error:', err);
          setError(err instanceof Error ? err.message : 'Failed to parse file. Please check if the file is valid.');
          setSelectedFile(null);
          setTrackPoints([]);
        }
      } else {
        setError('Please select a valid file format (GPX, KML, KMZ, TCX, FIT, NMEA, CSV, or GeoJSON)');
        setSelectedFile(null);
        setTrackPoints([]);
      }
    }
  };

  // Image upload handlers
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
    setScreenshotImages((prev) => [...prev, { url: data.url, public_id: data.public_id, title: data.title }]);
  };

  const handleImageDelete = async (public_id: string) => {
    setScreenshotImages((prev) => prev.filter((img) => img.public_id !== public_id));
  };

  const handleSave = async () => {
    if (!routeName || routeName.trim().length === 0) {
      setError('Prosím zadejte název trasy');
      return;
    }

    if (!user || !user.id) {
      setError('Musíte být přihlášeni k nahrání trasy');
      return;
    }

    // Validation
    if (uploadMode === 'gpx' && (!selectedFile || trackPoints.length === 0)) {
      setError('Prosím nahrajte validní GPS soubor');
      return;
    }

    if (uploadMode === 'manual' && screenshotImages.length === 0) {
      setError('Prosím nahrajte alespoň jeden screenshot');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get current active season
      const seasonResponse = await fetch('/api/seasons');
      const seasons = await seasonResponse.json();
      const activeSeason = seasons.find((s: { isActive?: boolean }) => s.isActive) || seasons[seasons.length - 1];

      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeTitle: routeName.trim(),
          routeDescription: routeDescription.trim() || null,
          route: uploadMode === 'gpx' ? trackPoints : null,
          routeLink: uploadMode === 'gpx' ? JSON.stringify(trackPoints) : null,
          visitDate: new Date(),
          points: 0,
          visitedPlaces: '',
          dogNotAllowed: 'false',
          year: new Date().getFullYear(),
          seasonId: activeSeason?.id,
          state: 'DRAFT',
          userId: user.id,
          photos: uploadMode === 'manual' ? screenshotImages : [],
          places: [],
          extraData: extraData,
          extraPoints: {
            description: routeDescription.trim() || '',
            distance: 0,
            totalAscent: 0,
            elapsedTime: 0,
            averageSpeed: 0,
            source: uploadMode === 'gpx' ? 'gpx_upload' : 'screenshot'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save route');
      }

      const data = await response.json();
      onComplete(data.id);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit trasu. Zkuste to prosím znovu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Mode selection screen
  if (!uploadMode) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto py-4">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Jak chcete nahrát trasu?</h2>
          <p className="text-gray-300 max-w-lg mx-auto">Vyberte způsob, který vám nejvíce vyhovuje. Můžete nahrát záznam ze sporttesteru nebo screenshot aplikace.</p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-8">
          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUploadMode('gpx')}
            className="cursor-pointer group relative overflow-hidden rounded-3xl bg-black/80 border border-white/10 hover:border-blue-500/50 hover:bg-black/90 transition-all duration-300 shadow-2xl"
          >
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">GPX Soubor</h3>
                <p className="text-sm text-gray-200 leading-relaxed">Ideální pro exporty z Garmin connect, Mapy.cz a jiných sporttesterů. Automaticky načteme trasu a vypočítáme statistiky.</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {['GPX', 'KML', 'TCX', 'FIT'].map(fmt => (
                  <span key={fmt} className="px-2 py-1 rounded-md bg-white/5 text-[10px] uppercase font-semibold text-white/50 border border-white/5">{fmt}</span>
                ))}
              </div>
            </div>
            {/* Hover overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUploadMode('manual')}
            className="cursor-pointer group relative overflow-hidden rounded-3xl bg-black/80 border border-white/10 hover:border-purple-500/50 hover:bg-black/90 transition-all duration-300 shadow-2xl"
          >
            <div className="p-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Watch className="h-8 w-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Screenshot z hodinek</h3>
                <p className="text-sm text-gray-200 leading-relaxed">Pokud nemáte GPX soubor, stačí nahrát screenshot z aktivity (Apple Watch, Zepp Life) a my vám pomůžeme doplnit zbytek.</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {['PNG', 'JPG', 'WEBP'].map(fmt => (
                  <span key={fmt} className="px-2 py-1 rounded-md bg-white/5 text-[10px] uppercase font-semibold text-white/50 border border-white/5">{fmt}</span>
                ))}
              </div>
            </div>
            {/* Hover overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Mode Switch */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {uploadMode === 'gpx' ? (
              <>
                <div className="p-2 rounded-lg bg-blue-500/20"><Upload className="h-5 w-5 text-blue-400" /></div>
                Nahrát GPX soubor
              </>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-purple-500/20"><Camera className="h-5 w-5 text-purple-400" /></div>
                Nahrát screenshot
              </>
            )}
          </h2>
          <p className="text-sm text-gray-400 mt-1 pl-[52px]">
            {uploadMode === 'gpx' ? 'Importujte data přímo ze zařízení' : 'Manuální zadání dat s důkazní fotkou'}
          </p>
        </div>

        <button
          onClick={() => {
            setUploadMode(null);
            setError(null);
            setTrackPoints([]);
            setSelectedFile(null);
            setScreenshotImages([]);
          }}
          className="text-sm font-medium text-white/50 hover:text-white transition-colors px-4 py-2 hover:bg-white/5 rounded-full"
        >
          Změnit typ nahrávání
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-4"
        >
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-200">Něco se nepovedlo</h4>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
        </motion.div>
      )}

      {uploadMode === 'gpx' ? (
        // GPX Upload Mode
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          <div className="space-y-6">
            {/* Upload Zone */}
            <div className={cn(
              "relative group cursor-pointer transition-all duration-300",
              trackPoints.length > 0 ? "opacity-100" : "opacity-100"
            )}>
              <label
                htmlFor="gpx-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-300",
                  selectedFile
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-black/50 border-white/20 hover:bg-black/60 hover:border-blue-400/50"
                )}
              >
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300",
                    selectedFile ? "bg-green-500/20" : "bg-white/10 group-hover:bg-blue-500/20"
                  )}>
                    {selectedFile ? <Check className="h-8 w-8 text-green-400" /> : <Upload className="h-8 w-8 text-white/70 group-hover:text-blue-400" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-white">
                      {selectedFile ? "Soubor vybrán" : "Klikněte pro nahrání"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {selectedFile ? selectedFile.name : "GPX, KML, TCX, CSV, GeoJSON"}
                    </p>
                  </div>
                </div>
                <input
                  id="gpx-upload"
                  type="file"
                  accept=".gpx,.kml,.kmz,.tcx,.fit,.nmea,.csv,.geojson"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {trackPoints.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20"><MapIcon className="h-4 w-4 text-blue-400" /></div>
                <div className="text-blue-100 text-sm">
                  <span className="font-semibold">Úspěšně načteno:</span> {trackPoints.length} bodů trasy
                </div>
              </div>
            )}
          </div>

          {/* Map Preview */}
          <div className="relative h-80 xl:h-auto min-h-[300px] rounded-3xl overflow-hidden border border-white/10 bg-black/80">
            {trackPoints.length > 0 ? (
              <DynamicGpxEditor
                initialTrack={trackPoints}
                onSave={() => { }}
                readOnly
                hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/30">
                <div className="text-center space-y-2">
                  <MapPin className="h-10 w-10 mx-auto opacity-50" />
                  <p>Náhled mapy se zobrazí po nahrání</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Manual Mode - Screenshot Upload
        <div className="rounded-3xl bg-black/80 border border-white/10 p-6 sm:p-8 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-400" />
            Fotografie aktivity
          </h3>
          <EnhancedImageUpload
            sources={screenshotImages}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            stackingStyle="grid"
            aspectRatio="landscape"
            count={3}
          />
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            Nahrávejte pouze screenshoty z aplikací, kde jsou vidět údaje o trase.
          </p>
        </div>
      )}

      {/* Basic Info & Continue */}
      {((uploadMode === 'gpx' && trackPoints.length > 0) || uploadMode === 'manual') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 pt-8 mt-8 space-y-8"
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-green-400" />
                Základní údaje
              </h3>
              <div className="space-y-4">
                <IOSTextInput
                  label="Název trasy"
                  placeholder="Např. Výlet na Sněžku"
                  value={routeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteName(e.target.value)}
                  dark
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Popis trasy (nepovinné)</label>
                  <IOSTextarea
                    placeholder="Jak se vám šlo? Co jste viděli?"
                    value={routeDescription}
                    onChange={(value: string) => setRouteDescription(value)}
                    colors={{
                      background: 'bg-white/5 backdrop-blur-sm',
                      text: 'text-white',
                      placeholder: 'text-white/30',
                      border: 'border-white/10',
                      focus: 'border-blue-400/50'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Check className="h-5 w-5 text-yellow-400" />
                Doplňující informace
              </h3>
              {/* Dynamic Form Fields */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 mb-4">Pokud máte k trase další data, můžete je vyplnit zde.</p>
                <DynamicFormFields
                  values={extraData}
                  onChange={setExtraData}
                  dark={true}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <IOSButton
              variant="blue"
              size="lg"
              onClick={handleSave}
              disabled={isSaving || !routeName}
              loading={isSaving}
              icon={<ArrowRight className="h-5 w-5" />}
              className="w-full sm:w-auto px-8 h-12 text-lg shadow-xl shadow-blue-500/20"
            >
              Uložit a Pokračovat
            </IOSButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
