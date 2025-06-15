'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft, Map, Trophy, Loader2, Check, MapPin, BarChart, Camera } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitDataForm } from "@/components/forms/VisitDataForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import StepProgress from '@/components/ui/step-progress';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSTagInput } from "@/components/ui/ios/tag-input";
import { IOSCard } from "@/components/ui/ios/card";
import { ImageUpload, ImageSource } from "@/components/ui/ios/image-upload";

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
  track: string;
  displayTrack?: string;
  visitedPlaces: string[];
  extraPoints: {
    distance: number;
    totalAscent: number;
    elapsedTime: number;
    averageSpeed: number;
    difficulty: number;
  };
  photos: ImageSource[];
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

export default function FinishRoutePage() {
  const params = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
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
          routeTitle: data.routeTitle,
          routeDescription: data.routeDescription,
          track: data.routeLink || '',
          displayTrack: downsampleTrack(track).map(p => `${p.lat},${p.lng}`).join(','),
          visitedPlaces: data.visitedPlaces || [],
          extraPoints: data.extraPoints,
          photos: data.photos || []
        });
      } catch (err) {
        setError('Failed to load route');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [params.id]);

  const handlePublish = async () => {
    if (!route) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/visitData/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: "PENDING_REVIEW"
        }),
      });

      if (!response.ok) throw new Error('Failed to publish route');
      
      // Navigate to the results page
      router.push('/vysledky/moje');
    } catch (err) {
      setError('Failed to publish route');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePhotoUpload = async (file: File, title: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      
      const response = await fetch(`/api/competition/images/${params.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload photo');
      
      const data = await response.json();
      setRoute(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: [...prev.photos, {
            url: data.url,
            public_id: data.public_id,
            title: title
          }]
        };
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    }
  };

  const handlePhotoDelete = async (public_id: string) => {
    try {
      const response = await fetch(`/api/competition/images/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_id }),
      });

      if (!response.ok) throw new Error('Failed to delete photo');
      
      setRoute(prev => {
        if (!prev) return null;
        return {
          ...prev,
          photos: prev.photos.filter(photo => photo.public_id !== public_id)
        };
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError('Failed to delete photo');
    }
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
    <CommonPageTemplate contents={{header: true}} headerMode={"auto-hide"} currentUser={user} currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <StepProgress
          steps={['Nahrát trasu', 'Upravit trasu', 'Dokončení']}
          currentStep={3}
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
          <h1 className="text-3xl font-bold">Dokončení trasy</h1>
        </div>

        <div className="space-y-6">
          <IOSCard
            title="Základní informace"
            icon={<MapPin className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <IOSTextInput
                label="Název trasy"
                value={route?.routeTitle || ''}
                readOnly
              />
              <IOSTextarea
                value={route?.routeDescription || ''}
                readOnly
                onChange={() => {}}
              />
            </div>
          </IOSCard>

          <IOSCard
            title="Navštívená místa"
            icon={<Map className="h-5 w-5" />}
          >
            <IOSTagInput
              tags={route?.visitedPlaces || []}
              onChange={() => {}}
              placeholder="Žádná navštívená místa"
              label="Navštívená místa"
              readOnly
            />
          </IOSCard>

          <IOSCard
            title="Statistiky trasy"
            icon={<BarChart className="h-5 w-5" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <IOSTextInput
                label="Délka trasy (km)"
                type="number"
                value={route?.extraPoints?.distance?.toFixed(2) || '0'}
                readOnly
              />
              <IOSTextInput
                label="Převýšení (m)"
                type="number"
                value={route?.extraPoints?.totalAscent?.toFixed(0) || '0'}
                readOnly
              />
              <IOSTextInput
                label="Čas (min)"
                type="number"
                value={route?.extraPoints?.elapsedTime?.toFixed(0) || '0'}
                readOnly
              />
              <IOSTextInput
                label="Obtížnost (1-5)"
                type="number"
                value={route?.extraPoints?.difficulty?.toString() || '1'}
                readOnly
              />
            </div>
          </IOSCard>

          <IOSCard
            title="Fotky"
            icon={<Camera className="w-5 h-5" />}
            className="mt-6"
          >
            <ImageUpload
              sources={route.photos}
              onUpload={handlePhotoUpload}
              onDelete={handlePhotoDelete}
              count={4}
              stackingStyle="grid"
              aspectRatio="square"
              showUploadButton={true}
              showDeleteButton={true}
              className="mt-4"
              uploadButtonClassName="bg-white/50 hover:bg-white/70"
              deleteButtonClassName="bg-red-600/90 hover:bg-red-600"
              imageContainerClassName="rounded-xl overflow-hidden"
              placeholderClassName="rounded-xl"
            />
          </IOSCard>

          <div className="flex justify-end pb-8">
            <IOSButton 
              onClick={handlePublish}
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium py-6 text-lg"
              disabled={isPublishing}
              loading={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4" />
                  Odesílání...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Odeslat ke schválení
                </>
              )}
            </IOSButton>
          </div>
        </div>
      </div>
    </CommonPageTemplate>
  );
}