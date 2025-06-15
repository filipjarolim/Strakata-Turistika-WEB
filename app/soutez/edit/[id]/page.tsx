'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft, Check, MapPin, Map, BarChart, Image, Camera } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitDataForm } from "@/components/forms/VisitDataForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { ExtendedUser } from "@/next-auth";
import StepProgress from '@/components/ui/step-progress';
import { ImageUpload, ImageSource } from "@/components/ui/ios/image-upload";
import { useCloudinaryUpload } from "@/lib/hooks/use-cloudinary-upload";
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSTagInput } from "@/components/ui/ios/tag-input";
import { IOSCard } from "@/components/ui/ios/card";

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
    difficulty: number;
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
  visitedPlaces: string[];
  dogNotAllowed: string;
  routeTitle?: string;
  routeDescription?: string;
  distance?: string;
  elevation?: string;
  time?: string;
  difficulty?: string;
  photos: ImageSource[];
}

interface ImageData {
  url: string;
  public_id: string;
  title: string;
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
  const [isSaving, setIsSaving] = useState(false);
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [images, setImages] = useState<ImageSource[]>([]);
  const { upload, deleteImage, isUploading, error: cloudinaryError } = useCloudinaryUpload({
    maxWidth: 1920,
    maxHeight: 1080,
    quality: "good",
    format: "webp",
    competitionId: Array.isArray(params.id) ? params.id[0] : params.id || ''
  });

  const [formData, setFormData] = useState<FormData>({
    visitedPlaces: [],
    dogNotAllowed: "false",
    routeLink: '',
    routeTitle: '',
    routeDescription: '',
    distance: '0',
    elevation: '0',
    time: '0',
    difficulty: '1',
    photos: []
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
            averageSpeed: data.extraPoints?.averageSpeed || 0,
            difficulty: data.extraPoints?.difficulty || 1
          }
        });

        // Fetch images after route data is loaded
        try {
          const response = await fetch(`/api/competition/images/${params.id}`);
          if (!response.ok) throw new Error('Failed to fetch images');
          const data = await response.json();
          setImages(data.resources.map((img: ImageData) => ({
            url: img.url,
            public_id: img.public_id,
            title: img.title
          })));
        } catch (error) {
          console.error('Error fetching images:', error);
        }
      } catch (err) {
        setError('Failed to load route');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [params.id]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/routes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          visitedPlaces: formData.visitedPlaces.join(','),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save route');
      }

      router.push(`/soutez/finish/${params.id}`);
    } catch (error) {
      console.error('Error saving route:', error);
      setError('Nepodařilo se uložit trasu. Zkuste to prosím znovu.');
    } finally {
      setIsSaving(false);
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

  const handleImageUpload = async (file: File, title: string) => {
    const result = await upload(file, title);
    setImages((prev) => [
      ...prev,
      {
        url: result.url,
        public_id: result.public_id,
        title: title,
      },
    ]);
  };

  const handleImageDelete = async (public_id: string) => {
    await deleteImage(public_id);
    setImages((prev) => prev.filter((img) => img.public_id !== public_id));
  };

  const handlePhotoUpload = async (file: File, title: string) => {
    const result = await upload(file, title);
    setFormData((prev) => ({
      ...prev,
      photos: [
        ...prev.photos,
        {
          url: result.url,
          public_id: result.public_id,
          title: title,
        },
      ],
    }));
  };

  const handlePhotoDelete = async (public_id: string) => {
    await deleteImage(public_id);
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((img) => img.public_id !== public_id),
    }));
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

        <div className="space-y-6">
          <IOSCard
            title="Základní informace"
            icon={<MapPin className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <IOSTextInput
                label="Název trasy"
                value={formData.routeTitle || route?.routeTitle || ''}
                onChange={(e) => setFormData({ ...formData, routeTitle: e.target.value })}
              />
              <IOSTextarea
                value={formData.routeDescription || route?.routeDescription || ''}
                onChange={(value) => setFormData({ ...formData, routeDescription: value })}
              />
            </div>
          </IOSCard>

          <IOSCard
            title="Navštívená místa"
            icon={<Map className="h-5 w-5" />}
          >
            <IOSTagInput
              tags={formData.visitedPlaces}
              onChange={(tags) => setFormData({ ...formData, visitedPlaces: tags })}
              placeholder="Přidejte navštívená místa..."
              label="Navštívená místa"
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
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              />
              <IOSTextInput
                label="Převýšení (m)"
                type="number"
                value={route?.extraPoints?.totalAscent?.toFixed(0) || '0'}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
              />
              <IOSTextInput
                label="Čas (min)"
                type="number"
                value={route?.extraPoints?.elapsedTime?.toFixed(0) || '0'}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
              <IOSTextInput
                label="Obtížnost (1-5)"
                type="number"
                min="1"
                max="5"
                value={route?.extraPoints?.difficulty?.toString() || '1'}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              />
            </div>
          </IOSCard>

          <IOSCard
            title="Fotky"
            icon={<Camera className="w-5 h-5" />}
            className="mt-6"
          >
            <ImageUpload
              sources={formData.photos}
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

          <IOSCard
            title="Náhled trasy"
            icon={<Map className="h-5 w-5" />}
            subtitle="Upravte trasu na mapě"
          >
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border">
              <DynamicGpxEditor onSave={handleTrackSave} initialTrack={route.displayTrack || route.track} />
            </div>
          </IOSCard>

          <div className="flex justify-end pb-8">
            <IOSButton 
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-white font-medium py-6 text-lg"
            >
              <Check className="h-4 w-4" />
              Dokončit
            </IOSButton>
          </div>
        </div>
      </div>
    </CommonPageTemplate>
  );
} 