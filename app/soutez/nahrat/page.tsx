'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Upload, Save, MapIcon, MapPin, BarChart, ArrowLeft, ArrowRight } from "lucide-react";
import dynamic from 'next/dynamic';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { IOSStepProgress } from '@/components/ui/ios/step-progress';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSTagInput } from "@/components/ui/ios/tag-input";
import { IOSCard } from "@/components/ui/ios/card";
import { cn } from "@/lib/utils";

// Import GPX Editor dynamically to handle SSR
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

interface GeoJSONFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

interface GeoJSON {
  type: string;
  features?: GeoJSONFeature[];
  geometry?: {
    type: string;
    coordinates: number[][] | number[][][];
  };
}

// Add downsampling function
function downsampleTrack(points: Point[], maxPoints = 1000): Point[] {
  if (points.length <= maxPoints) return points;

  // Calculate the step size to get approximately maxPoints
  const step = Math.ceil(points.length / maxPoints);

  // Always include first and last point
  const result: Point[] = [points[0]];

  // Sample points at regular intervals
  for (let i = step; i < points.length - step; i += step) {
    result.push(points[i]);
  }

  // Add the last point
  result.push(points[points.length - 1]);

  return result;
}

export default function NahratPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [trackPoints, setTrackPoints] = useState<Point[]>([]);
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [activityType, setActivityType] = useState<'visit' | 'create-route'>('visit');
  const [routeLink, setRouteLink] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

            case '.kmz':
              // For KMZ, we need to unzip first (not implemented yet)
              if (fileExtension === '.kmz') {
                throw new Error('KMZ support coming soon!');
              }
              break;

            case '.tcx':
              const tcxDoc = parser.parseFromString(text, "text/xml");
              const trackPoints = Array.from(tcxDoc.getElementsByTagName("Trackpoint"));
              points = trackPoints.map(point => {
                const latElement = point.getElementsByTagName("LatitudeDegrees")[0];
                const lonElement = point.getElementsByTagName("LongitudeDegrees")[0];
                return {
                  lat: parseFloat(latElement.textContent || '0'),
                  lng: parseFloat(lonElement.textContent || '0')
                };
              });
              break;

            case '.csv':
              const rows = text.split('\n').map(row => row.split(','));
              // Assume first row is header, try to find lat/lng columns
              const headers = rows[0].map(h => h.toLowerCase().trim());
              const latIndex = headers.findIndex(h => h.includes('lat'));
              const lngIndex = headers.findIndex(h => h.includes('lon') || h.includes('lng'));

              if (latIndex === -1 || lngIndex === -1) {
                throw new Error('CSV must have latitude and longitude columns');
              }

              points = rows.slice(1).map(row => ({
                lat: parseFloat(row[latIndex]),
                lng: parseFloat(row[lngIndex])
              })).filter(point => !isNaN(point.lat) && !isNaN(point.lng));
              break;

            case '.geojson':
              const geojson = JSON.parse(text);
              if (geojson.type === 'Feature') {
                if (geojson.geometry.type === 'LineString') {
                  points = geojson.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
                    lat,
                    lng
                  }));
                } else if (geojson.geometry.type === 'MultiLineString') {
                  points = geojson.geometry.coordinates.flat().map(([lng, lat]: [number, number]) => ({
                    lat,
                    lng
                  }));
                }
              } else if (geojson.type === 'FeatureCollection') {
                points = geojson.features
                  .filter((f: GeoJSONFeature) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString')
                  .flatMap((f: GeoJSONFeature) => {
                    if (f.geometry.type === 'LineString') {
                      return f.geometry.coordinates;
                    } else {
                      return f.geometry.coordinates.flat();
                    }
                  })
                  .map(([lng, lat]: [number, number]) => ({ lat, lng }));
              }
              break;

            case '.fit':
            case '.nmea':
              throw new Error(`Support for ${fileExtension.toUpperCase()} files coming soon!`);

            default:
              throw new Error('Unsupported file format');
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
    if (!selectedFile || !routeName || trackPoints.length === 0 || !user) return;

    setIsSaving(true);
    try {
      if (activityType === 'create-route') {
        // Create Custom Route
        const response = await fetch('/api/custom-routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: routeName,
            description: routeDescription,
            link: routeLink,
            parts: {},
            route: trackPoints,
            creatorId: user.id
          })
        });

        if (!response.ok) throw new Error('Failed to submit route for approval');
        router.push('/auth/profil');
      } else {
        // Create new VisitData (route)
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
        // Navigate to the edit page
        router.push(`/soutez/edit/${data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role} className="px-3 sm:px-4 md:px-6">
        <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-5xl">
          <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[400px] bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-[400px] bg-gray-200 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </CommonPageTemplate>
    );
  }

  return (
    <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <IOSStepProgress
          steps={['Nahrát trasu', 'Upravit trasu', 'Dokončení']}
          currentStep={1}
          className="mb-8"
          stepImages={[
            '/icons/upload.png',
            '/icons/edit.png',
            '/icons/finish.png',
          ]}
        />
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            <span className="hidden sm:inline">Nahrát trasu závodu</span>
            <span className="sm:hidden">Nahrát trasu</span>
          </h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <IOSCard
            title="Nahrát trasu"
            subtitle="Nahrajte soubor s GPS trasou závodu (GPX, KML, TCX a další formáty)"
            icon={<Upload className="h-5 w-5" />}
            iconBackground="bg-blue-100"
            iconColor="text-blue-600"
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="gpx-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-48 sm:h-64 border-2 border-dashed rounded-xl cursor-pointer",
                    "bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors",
                    "border-gray-200 hover:border-blue-500/50",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-4 sm:pt-5 pb-4 sm:pb-6 px-2">
                    <Upload className="w-8 h-8 sm:w-10 sm:h-10 mb-2 sm:mb-3 text-gray-400" />
                    <p className="mb-2 text-xs sm:text-sm text-gray-500 text-center">
                      <span className="font-semibold">Klikněte pro nahrání</span>
                      <span className="hidden sm:inline"> nebo přetáhněte soubor sem</span>
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 text-center leading-tight">
                      <span className="hidden sm:inline">Podporované formáty: GPX, KML, KMZ, TCX, FIT, NMEA, CSV, GeoJSON</span>
                      <span className="sm:hidden">GPX, KML, TCX, CSV, GeoJSON</span>
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
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  <span>Vybraný soubor: {selectedFile.name}</span>
                </div>
              )}
            </div>
          </IOSCard>

          {trackPoints.length > 0 && (
            <IOSCard
              title="Náhled trasy"
              subtitle="Zkontrolujte nahranou trasu"
              icon={<MapPin className="h-5 w-5" />}
              iconBackground="bg-green-100"
              iconColor="text-green-600"
              variant="elevated"
            >
              <div className="h-48 sm:h-64">
                <DynamicGpxEditor
                  initialTrack={trackPoints}
                  onSave={() => { }}
                  readOnly
                  hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
                />
              </div>
            </IOSCard>
          )}
        </div>

        {trackPoints.length > 0 && (
          <IOSCard
            title="Typ aktivity"
            subtitle="O jaký typ aktivity se jedná?"
            icon={<MapPin className="h-5 w-5" />}
            iconBackground="bg-orange-100"
            iconColor="text-orange-600"
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setActivityType('visit')}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 transition-all text-left",
                    activityType === 'visit'
                      ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20"
                      : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                  )}
                >
                  <div className="font-semibold text-lg mb-1">Jdu trasu</div>
                  <div className="text-sm text-muted-foreground">Splnil jsem existující nebo vlastní výzvu a chci nahrát výsledek.</div>
                </button>
                <button
                  onClick={() => setActivityType('create-route')}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 transition-all text-left",
                    activityType === 'create-route'
                      ? "border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20"
                      : "border-gray-200 hover:border-purple-200 hover:bg-gray-50"
                  )}
                >
                  <div className="font-semibold text-lg mb-1">Tvořím trasu</div>
                  <div className="text-sm text-muted-foreground">Navrhl jsem novou trasu pro ostatní (Strakatá trasa).</div>
                </button>
              </div>

              {/* Warnings */}
              {activityType === 'visit' && warnings.length > 0 && (
                <div className="space-y-2">
                  {warnings.map((w, i) => (
                    <Alert key={i} variant="default" className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Upozornění</AlertTitle>
                      <AlertDescription className="text-yellow-700">{w}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </IOSCard>
        )}

        {trackPoints.length > 0 && (
          <IOSCard
            title="Základní informace"
            subtitle="Vyplňte základní informace o trase"
            icon={<BarChart className="h-5 w-5" />}
            iconBackground="bg-purple-100"
            iconColor="text-purple-600"
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <IOSTextInput
                  label="Název trasy"
                  placeholder="Zadejte název trasy"
                  value={routeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Popis trasy</Label>
                  <IOSTextarea
                    placeholder="Popište svoji trasu, zajímavá místa a zážitky z cesty. Nezapomeňte zmínit zajímavé body, obtížnost a případná omezení..."
                    value={routeDescription}
                    onChange={(value: string) => setRouteDescription(value)}
                  />
                </div>
              </div>

              {activityType === 'create-route' && (
                <div className="space-y-2">
                  <IOSTextInput
                    label="Odkaz na mapy.cz"
                    placeholder="https://en.mapy.cz/..."
                    value={routeLink}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteLink(e.target.value)}
                  />
                </div>
              )}
            </div>
          </IOSCard>
        )}

        {trackPoints.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <IOSButton
              variant={activityType === 'create-route' ? 'primary' : 'blue'}
              size="lg"
              onClick={handleSave}
              disabled={isSaving || !routeName || (activityType === 'create-route' && !routeLink)}
              loading={isSaving}
              icon={<ArrowRight className="h-5 w-5" />}
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">
                {activityType === 'create-route' ? 'Odeslat ke schválení' : 'Pokračovat na úpravu trasy'}
              </span>
              <span className="sm:hidden">Pokračovat</span>
            </IOSButton>
          </div>
        )}
      </div>
    </CommonPageTemplate>
  );
}

