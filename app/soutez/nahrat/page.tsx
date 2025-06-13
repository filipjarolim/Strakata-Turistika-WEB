'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Upload, Save, MapIcon } from "lucide-react";
import dynamic from 'next/dynamic';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.gpx')) {
        setSelectedFile(file);
        setError(null);
        
        try {
          // Parse GPX file
          const text = await file.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const trackpoints = Array.from(xmlDoc.getElementsByTagName("trkpt"));
          
          const points = trackpoints.map(point => ({
            lat: parseFloat(point.getAttribute("lat") || "0"),
            lng: parseFloat(point.getAttribute("lon") || "0")
          }));

          // Downsample the points if there are too many
          const downsampledPoints = downsampleTrack(points);
          setTrackPoints(downsampledPoints);
        } catch (err) {
          setError('Failed to parse GPX file. Please check if the file is valid.');
        }
      } else {
        setError('Please select a valid GPX file');
      }
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !routeName || trackPoints.length === 0) return;

    setIsSaving(true);
    try {
      // Create new VisitData (route)
      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: routeName,
          routeLink: JSON.stringify(trackPoints),
          visitDate: new Date(),
          points: 0,
          visitedPlaces: "GPS Route",
          dogNotAllowed: "false",
          year: new Date().getFullYear(),
          extraPoints: {
            description: routeDescription,
            distance: 0,
            totalAscent: 0,
            elapsedTime: 0,
            averageSpeed: 0,
            isApproved: false
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CommonPageTemplate contents={{header: true}} currentUser={user} currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <MapIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Nahrát trasu závodu</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Nahrát trasu</CardTitle>
              <CardDescription className="text-base">Nahrajte GPX soubor nebo použijte předpřipravenou trasu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gpx-file">GPX Soubor</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="gpx-file"
                      type="file"
                      accept=".gpx"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    <Button variant="outline" asChild>
                      <a href="/sample-routes/easy-trail.gpx" download>
                        <Upload className="h-4 w-4 mr-2" />
                        Stáhnout vzorovou trasu
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route-name">Název trasy</Label>
                  <Input
                    id="route-name"
                    placeholder="Zadejte název trasy"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route-description">Popis trasy</Label>
                  <Input
                    id="route-description"
                    placeholder="Zadejte popis trasy"
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Chyba</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  className="w-full"
                  disabled={!selectedFile || !routeName || trackPoints.length === 0}
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Ukládání...' : 'Uložit trasu'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {trackPoints.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-2xl">Náhled trasy</CardTitle>
                <CardDescription className="text-base">Zkontrolujte svou trasu před uložením</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border">
                  <DynamicGpxEditor 
                    onSave={() => {}} 
                    initialTrack={trackPoints} 
                    readOnly={true}
                    hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify']}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CommonPageTemplate>
  );
}

