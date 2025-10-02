'use client';

import React, { useState } from 'react';
import { Upload, MapIcon, MapPin, BarChart, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSButton } from '@/components/ui/ios/button';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const DynamicGpxEditor = dynamic(
  () => import('@/components/editor/GpxEditor').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="animate-pulse">Loading editor...</div>
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trackPoints, setTrackPoints] = useState<Point[]>([]);

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

  const handleSave = async () => {
    if (!selectedFile || !routeName || trackPoints.length === 0 || !user || !user.id) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeTitle: routeName,
          routeDescription: routeDescription,
          route: trackPoints,
          routeLink: JSON.stringify(trackPoints),
          visitDate: new Date(),
          points: 0,
          visitedPlaces: "GPS Route",
          dogNotAllowed: "false",
          year: new Date().getFullYear(),
          state: "DRAFT",
          userId: user.id,
          extraPoints: {
            description: routeDescription,
            distance: 0,
            totalAscent: 0,
            elapsedTime: 0,
            averageSpeed: 0
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
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 drop-shadow-lg">Nahrát trasu</h2>
        <p className="text-sm sm:text-base text-white/90">Nahrajte soubor s GPS trasou</p>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-900/80 backdrop-blur-xl border-red-500/50 text-white">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        <IOSCard
          title="Nahrát trasu"
          subtitle="Nahrajte soubor s GPS trasou (GPX, KML, TCX a další formáty)"
          icon={<Upload className="h-5 w-5" />}
          iconBackground="bg-blue-900/40"
          iconColor="text-blue-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="gpx-upload"
                className={cn(
                  "flex flex-col items-center justify-center w-full h-40 sm:h-48 md:h-64 border-2 border-dashed rounded-xl cursor-pointer",
                  "bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors",
                  "border-white/30 hover:border-blue-400/60",
                  "focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                )}
              >
                <div className="flex flex-col items-center justify-center pt-3 sm:pt-4 md:pt-5 pb-3 sm:pb-4 md:pb-6 px-2">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-2 sm:mb-3 text-white/70" />
                  <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-white/90 text-center">
                    <span className="font-semibold">Klikněte pro nahrání</span>
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/70 text-center leading-tight px-2">
                    GPX, KML, TCX, CSV, GeoJSON
                  </p>
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
            {selectedFile && (
              <div className="text-xs sm:text-sm text-white/90 flex items-center gap-2 overflow-hidden">
                <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Vybraný soubor: {selectedFile.name}</span>
              </div>
            )}
          </div>
        </IOSCard>

        {trackPoints.length > 0 && (
          <IOSCard
            title="Náhled trasy"
            subtitle="Zkontrolujte nahranou trasu"
            icon={<MapPin className="h-5 w-5" />}
            iconBackground="bg-green-900/40"
            iconColor="text-green-300"
            variant="elevated"
            className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
            titleClassName="text-white"
            subtitleClassName="text-white/70"
          >
            <div className="h-56 sm:h-64 md:h-80 lg:h-96">
              <DynamicGpxEditor
                initialTrack={trackPoints}
                onSave={() => {}}
                readOnly
                hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
              />
            </div>
          </IOSCard>
        )}
      </div>

      {trackPoints.length > 0 && (
        <IOSCard
          title="Základní informace"
          subtitle="Vyplňte základní informace o trase"
          icon={<BarChart className="h-5 w-5" />}
          iconBackground="bg-purple-900/40"
          iconColor="text-purple-300"
          variant="elevated"
          className="bg-black/60 backdrop-blur-xl border border-white/20 text-white"
          titleClassName="text-white"
          subtitleClassName="text-white/70"
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <IOSTextInput
                label="Název trasy"
                placeholder="Zadejte název trasy"
                value={routeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteName(e.target.value)}
                dark
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white/90">Popis trasy</Label>
              <IOSTextarea
                placeholder="Popište svoji trasu, zajímavá místa a zážitky z cesty..."
                value={routeDescription}
                onChange={(value: string) => setRouteDescription(value)}
                colors={{
                  background: 'bg-white/10 backdrop-blur-sm',
                  text: 'text-white',
                  placeholder: 'text-white/40',
                  border: 'border-white/20',
                  focus: 'border-blue-400'
                }}
              />
            </div>
          </div>
        </IOSCard>
      )}

      {trackPoints.length > 0 && (
        <div className="flex justify-end">
          <IOSButton
            variant="blue"
            size="lg"
            onClick={handleSave}
            disabled={isSaving || !routeName}
            loading={isSaving}
            icon={<ArrowRight className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            Pokračovat na úpravu trasy
          </IOSButton>
        </div>
      )}
    </div>
  );
}

