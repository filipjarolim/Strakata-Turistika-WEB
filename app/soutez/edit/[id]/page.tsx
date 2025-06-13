'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitDataForm } from "@/components/forms/VisitDataForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { ExtendedUser } from "@/next-auth";


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
  name: string;
  description: string;
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
    isApproved: boolean;
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
  visitDate: Date;
  points: number;
  visitedPlaces: string;
  dogNotAllowed: string;
  year: number;
  extraPoints: {
    description: string;
    distance?: number;
    totalAscent?: number;
    elapsedTime?: number;
    averageSpeed?: number;
    isApproved?: boolean;
  };
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

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(`/api/visitData/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch route');
        const data = await response.json();
        const track = data.routeLink ? JSON.parse(data.routeLink) : [];
        
        setRoute({
          id: data.id,
          name: data.fullName,
          description: data.extraPoints?.description || '',
          track: track,
          displayTrack: downsampleTrack(track),
          season: data.year || 0,
          extraPoints: {
            description: data.extraPoints?.description || '',
            distance: data.extraPoints?.distance || 0,
            totalAscent: data.extraPoints?.totalAscent || 0,
            elapsedTime: data.extraPoints?.elapsedTime || 0,
            averageSpeed: data.extraPoints?.averageSpeed || 0,
            isApproved: data.extraPoints?.isApproved || false
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

  const handleSave = async (data: FormData) => {
    if (!route) return;

    try {
      const response = await fetch(`/api/visitData/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          routeLink: JSON.stringify(route.track),
          extraPoints: {
            ...data.extraPoints,
            isApproved: false
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
    <CommonPageTemplate contents={{header: true}} currentUser={user} currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Route</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Route Details</CardTitle>
              <CardDescription className="text-base">Review and finalize your route details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <VisitDataForm
                initialData={{
                  fullName: route.name || "",
                  visitDate: new Date(),
                  points: 0,
                  visitedPlaces: '',
                  dogNotAllowed: "false",
                  year: new Date().getFullYear(),
                  extraPoints: {
                    ...route.extraPoints,
                    description: route.description
                  }
                }}
                onSubmit={handleSave}
                submitLabel="Save Changes"
                user={user || null}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-2xl">Route Statistics</CardTitle>
              <CardDescription className="text-base">Calculated from your route</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold">{route.extraPoints?.distance?.toFixed(2) || '0'} km</p>
                </div>
                <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Elevation</p>
                  <p className="text-2xl font-bold">{route.extraPoints?.totalAscent?.toFixed(0) || '0'} m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-muted/50">
            <CardTitle className="text-2xl">Route Preview</CardTitle>
            <CardDescription className="text-base">Edit your route on the map</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border">
              <DynamicGpxEditor onSave={handleTrackSave} initialTrack={route.displayTrack || route.track} />
            </div>
          </CardContent>
        </Card>
      </div>
    </CommonPageTemplate>
  );
} 