'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft, Check } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitDataForm } from "@/components/forms/VisitDataForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { ExtendedUser } from "@/next-auth";
import StepProgress from '@/components/ui/step-progress';


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

interface Route {
  id: string;
  routeTitle: string;
  routeDescription: string;
  routeLink: string;
  track: {
    lat: number;
    lng: number;
  }[];
  displayTrack?: {
    lat: number;
    lng: number;
  }[];
  season: number;
  extraPoints?: {
    description: string;
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    averageSpeed: number;
  };
}

interface User {
  name: string | null;
  dogName: string | null;
  role?: string;
  isTwoFactorEnabled?: boolean;
  isOAuth?: boolean;
  email?: string;
}

interface TrackPoint {
  lat: number;
  lng: number;
  ele?: number;
}

interface FormData {
  routeLink?: string;
  visitedPlaces: string;
  dogNotAllowed: string;
  routeTitle?: string;
  routeDescription?: string;
}

// Add downsampling function
function downsampleTrack(points: { lat: number; lng: number }[], maxPoints = 1000) {
  if (points.length <= maxPoints) return points;
  
  // Calculate the step size to get approximately maxPoints
  const step = Math.ceil(points.length / maxPoints);
  
  // Always include first and last point
  const result = [points[0]];
  
  // Sample points at regular intervals
  for (let i = step; i < points.length - step; i += step) {
    result.push(points[i]);
  }
  
  // Add the last point
  result.push(points[points.length - 1]);
  
  return result;
}

export default function EditRoutePage() {
  const params = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useCurrentUser();
  const role = useCurrentRole();

  const [formData, setFormData] = useState<FormData>({
    visitedPlaces: '',
    dogNotAllowed: "false",
    routeLink: '',
    routeTitle: '',
    routeDescription: ''
  });

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/visitData/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch route');
        const data = await response.json();
        const track = data.routeLink ? JSON.parse(data.routeLink) : [];
        
        setRoute({
          id: data.id,
          routeTitle: data.routeTitle,
          routeDescription: data.routeDescription,
          routeLink: data.routeLink || '',
          track: track,
          displayTrack: downsampleTrack(track),
          season: data.year || 0,
          extraPoints: {
            description: data.extraPoints?.description || '',
            distance: data.extraPoints?.distance || 0,
            totalAscent: data.extraPoints?.totalAscent || 0,
            elapsedTime: data.extraPoints?.elapsedTime || 0,
            averageSpeed: data.extraPoints?.averageSpeed || 0
          }
        });
      } catch (err) {
        setError('Failed to load route');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [params.id]);

  const handleSave = async () => {
    if (!route || !user) return;

    try {
      const response = await fetch(`/api/visitData/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          routeTitle: formData.routeTitle || route.routeTitle,
          routeDescription: formData.routeDescription || route.routeDescription,
          routeLink: formData.routeLink || JSON.stringify(route.track),
          route: route.track,
          userId: user.id,
          extraPoints: {
            description: formData.routeDescription || route.routeDescription,
            distance: route.extraPoints?.distance || 0,
            totalAscent: route.extraPoints?.totalAscent || 0,
            elapsedTime: route.extraPoints?.elapsedTime || 0,
            averageSpeed: route.extraPoints?.averageSpeed || 0
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to save route');
      
      // Navigate to the finish page
      router.push(`/soutez/finish/${params.id}`);
    } catch (err) {
      setError('Failed to save route');
    }
  };

  const handleTrackSave = (track: TrackPoint[]) => {
    if (!route) return;
    setRoute({
      ...route,
      track: track,
      displayTrack: downsampleTrack(track)
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Route not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <CommonPageTemplate contents={{header: true}} currentUser={user} headerMode="auto-hide" currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <StepProgress
          steps={['Nahrát trasu', 'Upravit trasu', 'Dokončení']}
          currentStep={2}
          className="mb-8"
          stepImages={[
            '/icons/upload.png',
            '/icons/edit.png',
            '/icons/finish.png',
          ]}
        />
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Úprava trasy</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Detaily trasy</CardTitle>
              <CardDescription className="text-base">Zkontrolujte a dokončete detaily trasy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <VisitDataForm
                initialData={{
                  visitedPlaces: '',
                  dogNotAllowed: "false",
                  routeLink: '',
                  routeTitle: route.routeTitle,
                  routeDescription: route.routeDescription
                }}
                onSubmit={handleFormChange}
                user={user || null}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Statistiky trasy</CardTitle>
              <CardDescription className="text-base">Vypočítáno z vaší trasy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Vzdálenost</p>
                  <p className="text-2xl font-bold">{route.extraPoints?.distance?.toFixed(2) || '0'} km</p>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Převýšení</p>
                  <p className="text-2xl font-bold">{route.extraPoints?.totalAscent?.toFixed(0) || '0'} m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-2xl">Náhled trasy</CardTitle>
            <CardDescription className="text-base">Upravte trasu na mapě</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border">
              <DynamicGpxEditor onSave={handleTrackSave} initialTrack={route.displayTrack || route.track} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button 
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium py-6 text-lg"
          >
            <div className="h-6 w-6 rounded-full border-2 border-white mr-2 flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
            Dokončit
          </Button>
        </div>
      </div>
    </CommonPageTemplate>
  );
} 