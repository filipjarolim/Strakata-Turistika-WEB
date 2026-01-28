'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft, Check, MapPin, Map, BarChart, Image, Camera, ArrowRight } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitDataForm } from "@/components/forms/VisitDataForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { ExtendedUser } from "@/next-auth";
import { IOSStepProgress } from '@/components/ui/ios/step-progress';
import { ImageUpload, ImageSource } from "@/components/ui/ios/image-upload";
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSTagInput } from "@/components/ui/ios/tag-input";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSImageShowcase } from '@/components/ui/ios/image-showcase';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { IOSCalendar } from '@/components/ui/ios/calendar';

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
  visitDate: Date | null;
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

// Calculate distance between two points using Haversine formula
function calculateDistance(point1: TrackPoint, point2: TrackPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateElevationGain(points: TrackPoint[]): number {
  let totalGain = 0;
  for (let i = 1; i < points.length; i++) {
    const ele1 = points[i - 1].ele || 0;
    const ele2 = points[i].ele || 0;
    const diff = ele2 - ele1;
    if (diff > 0) {
      totalGain += diff;
    }
  }
  return totalGain;
}

function calculateRouteStats(points: TrackPoint[]): { distance: number; elevationGain: number } {
  if (points.length < 2) return { distance: 0, elevationGain: 0 };

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i - 1], points[i]);
  }

  const elevationGain = calculateElevationGain(points);

  return {
    distance: totalDistance,
    elevationGain
  };
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
  const [isUploading, setIsUploading] = useState(false);
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null);

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

  const [visitDate, setVisitDate] = useState<Date | null>(null);

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
          displayTrack: track && track.length > 0 ? downsampleTrack(track) : [],
          season: data.year || 0,
          visitDate: data.visitDate ? new Date(data.visitDate) : null,
          extraPoints: {
            description: data.extraPoints?.description || '',
            distance: data.extraPoints?.distance || 0,
            totalAscent: data.extraPoints?.totalAscent || 0,
            elapsedTime: data.extraPoints?.elapsedTime || 0,
            averageSpeed: data.extraPoints?.averageSpeed || 0,
            difficulty: data.extraPoints?.difficulty || 1
          }
        });
        setVisitDate(data.visitDate ? new Date(data.visitDate) : null);

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


      // Calculate route statistics
      const stats = calculateRouteStats(route?.track || []);

      const response = await fetch(`/api/visitData/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          visitedPlaces: formData.visitedPlaces.join(','),
          routeTitle: route?.routeTitle,
          routeDescription: route?.routeDescription,
          routeLink: JSON.stringify(route?.track || []),
          visitDate: route?.visitDate,
          photos: images,
          extraPoints: {
            description: route?.routeDescription || '',
            distance: stats.distance,
            totalAscent: stats.elevationGain,
            elapsedTime: parseFloat(formData.time || '0') * 60, // convert hours to minutes
            averageSpeed: stats.distance / (parseFloat(formData.time || '1') || 1), // km/h
            difficulty: parseFloat(formData.difficulty || '1')
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response error:', { status: response.status, errorData });
        throw new Error('Failed to save route');
      }

      // Store data in sessionStorage for the finish page
      sessionStorage.setItem('routeData', JSON.stringify({
        routeTitle: route?.routeTitle,
        routeDescription: route?.routeDescription,
        dogNotAllowed: formData.dogNotAllowed,
        visitDate: route?.visitDate,
        photos: images,
        extraPoints: {
          description: route?.routeDescription || '',
          distance: stats.distance,
          totalAscent: stats.elevationGain,
          elapsedTime: parseFloat(formData.time || '0') * 60,
          averageSpeed: stats.distance / (parseFloat(formData.time || '1') || 1),
          difficulty: parseFloat(formData.difficulty || '1')
        }
      }));

      // Navigate to the finish page
      router.push(`/soutez/finish/${params.id}`);
    } catch (err) {
      console.error('Error saving route:', err);
      setError(err instanceof Error ? err.message : 'Failed to save route');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackSave = (track: TrackPoint[]) => {
    if (!route) return;

    // Calculate new route statistics
    const stats = calculateRouteStats(track);

    // Update route with new track and stats
    const updatedRoute = {
      ...route,
      track: track,
      displayTrack: downsampleTrack(track),
      extraPoints: {
        ...route.extraPoints,
        description: route.extraPoints?.description || '',
        distance: stats.distance,
        totalAscent: stats.elevationGain,
        elapsedTime: route.extraPoints?.elapsedTime || 0,
        averageSpeed: stats.distance / (parseFloat(formData.time || '1') || 1),
        difficulty: route.extraPoints?.difficulty || 1
      }
    };

    setRoute(updatedRoute);

    // Store updated route in sessionStorage
    sessionStorage.setItem('routeData', JSON.stringify({
      ...updatedRoute,
      routeLink: JSON.stringify(track), // Store track as stringified JSON
      photos: images
    }));
  };

  const upload = async (file: File) => {
    setIsUploading(true);
    setCloudinaryError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'your_upload_preset'); // Replace with your actual upload preset

      const response = await fetch(`https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      setCloudinaryError(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (publicId: string) => {
    // Implement image deletion if needed

  };

  const handleImageUpload = async (file: File, title: string) => {
    const result = await upload(file);
    setImages((prev) => [
      ...prev,
      {
        url: result,
        public_id: '',
        title: title,
      },
    ]);
  };

  const handleImageDelete = async (public_id: string) => {
    await deleteImage(public_id);
    setImages((prev) => prev.filter((img) => img.public_id !== public_id));
  };

  const handlePhotoUpload = async (file: File, title: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');

      const response = await fetch('/api/competition/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const newImage = {
        url: data.url,
        public_id: data.public_id,
        title: title
      };

      const updatedImages = [...images, newImage];
      setImages(updatedImages);

      // Update route with new photos
      if (route) {
        const updatedRoute = {
          ...route,
          photos: updatedImages
        };
        setRoute(updatedRoute);

        // Update sessionStorage
        sessionStorage.setItem('routeData', JSON.stringify(updatedRoute));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
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
      <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role} className="px-6">
        <div className="container mx-auto py-6 space-y-6 max-w-5xl">
          <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid gap-6">
            <div className="h-[400px] bg-gray-200 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </CommonPageTemplate>
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
    <CommonPageTemplate contents={{ header: true }} currentUser={user} headerMode="auto-hide" currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <IOSStepProgress
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <IOSCard
            title="Upravit trasu"
            subtitle="Upravte trasu podle potřeby"
            icon={<MapPin className="h-5 w-5" />}
            iconBackground="bg-blue-100 dark:bg-blue-500/20"
            iconColor="text-blue-600 dark:text-blue-400"
            variant="elevated"
          >
            <div className="h-[400px]">
              <DynamicGpxEditor
                initialTrack={route.track}
                onSave={handleTrackSave}
                hideControls={[]}
              />
            </div>
          </IOSCard>

          <IOSCard
            title="Základní informace"
            subtitle="Upravte základní informace o trase"
            icon={<BarChart className="h-5 w-5" />}
            iconBackground="bg-purple-100 dark:bg-purple-500/20"
            iconColor="text-purple-600 dark:text-purple-400"
            variant="elevated"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <IOSTextInput
                  label="Název trasy"
                  placeholder="Zadejte název trasy"
                  value={route?.routeTitle || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoute(route ? { ...route, routeTitle: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Datum absolvování trasy</Label>
                <IOSCalendar
                  selectedDate={visitDate}
                  onDateChange={(date) => {
                    setVisitDate(date);
                    if (route) {
                      setRoute({
                        ...route,
                        visitDate: date
                      });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Popis trasy</Label>
                <IOSTextarea
                  placeholder="Popište svoji trasu, zajímavá místa a zážitky z cesty. Nezapomeňte zmínit zajímavé body, obtížnost a případná omezení..."
                  value={route?.routeDescription || ''}
                  onChange={(value: string) => setRoute(route ? { ...route, routeDescription: value } : null)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/40 transition-all hover:bg-white/50 dark:hover:bg-white/5 hover:border-indigo-500/50 backdrop-blur-xl">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Zákaz vstupu se psy</span>
                <IOSSwitch
                  checked={formData.dogNotAllowed === "true"}
                  onCheckedChange={(checked) => setFormData({ ...formData, dogNotAllowed: checked ? "true" : "false" })}
                />
              </div>
            </div>
          </IOSCard>

          <IOSCard
            title="Fotografie"
            subtitle="Přidejte fotografie z trasy"
            icon={<Camera className="h-5 w-5" />}
            iconBackground="bg-amber-100 dark:bg-amber-500/20"
            iconColor="text-amber-600 dark:text-amber-400"
            variant="elevated"
          >
            <ImageUpload
              sources={images}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              stackingStyle="grid"
              aspectRatio="landscape"
              className="mt-4"
            />
          </IOSCard>
        </div>

        <div className="flex justify-end gap-4">
          <IOSButton
            variant="blue"
            size="lg"
            onClick={handleSave}
            disabled={isSaving || !route?.routeTitle}
            loading={isSaving}
            icon={<ArrowRight className="h-5 w-5" />}
          >
            Pokračovat na dokončení
          </IOSButton>
        </div>
      </div>
    </CommonPageTemplate>
  );
} 