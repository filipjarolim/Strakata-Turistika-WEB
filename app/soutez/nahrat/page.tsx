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
import StepProgress from '@/components/ui/step-progress';
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
    if (!selectedFile || !routeName || trackPoints.length === 0 || !user) return;

    setIsSaving(true);
    try {
      // Create new VisitData (route)
      const response = await fetch('/api/visitData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeTitle: routeName,
          routeDescription: routeDescription,
          route: trackPoints, // Store the full GPS points array
          routeLink: JSON.stringify(trackPoints),
          visitDate: new Date(),
          points: 0,
          visitedPlaces: "GPS Route",
          dogNotAllowed: "false",
          year: new Date().getFullYear(),
          state: "DRAFT",
          userId: user.id, // Add the user ID
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CommonPageTemplate contents={{header: true}} currentUser={user} currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <StepProgress
          steps={['Nahrát trasu', 'Upravit trasu', 'Dokončení']}
          currentStep={1}
          className="mb-8"
          stepImages={[
            '/icons/upload.png',
            '/icons/edit.png',
            '/icons/finish.png',
          ]}
        />
        <div className="flex items-center gap-2 mb-6">
          <MapIcon className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Nahrát trasu závodu</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <IOSCard
            title="Nahrát trasu"
            icon={<Upload className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="gpx-upload"
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer",
                    "bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors",
                    "border-gray-200 hover:border-blue-500/50",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  )}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Klikněte pro nahrání</span> nebo přetáhněte soubor
                    </p>
                    <p className="text-xs text-gray-500">GPX soubor (max. 10MB)</p>
                  </div>
                  <input
                    id="gpx-upload"
                    type="file"
                    accept=".gpx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </IOSCard>

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

