'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Save, ArrowLeft, Map, Trophy, Loader2, Check, MapPin, BarChart, Camera, Send } from "lucide-react";
import dynamic from 'next/dynamic';
import { VisitDataForm } from "@/components/forms/VisitDataForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { IOSStepProgress } from '@/components/ui/ios/step-progress';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSTagInput } from "@/components/ui/ios/tag-input";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSImageShowcase } from '@/components/ui/ios/image-showcase';

import { ImageSource } from '@/types';
import { IOSCalendar } from '@/components/ui/ios/calendar';
import { cn } from '@/lib/utils';

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
  visitDate: Date | null;
  extraPoints?: {
    description: string;
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

const InfoSection = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <div className="space-y-1">
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    <div className="text-base font-medium text-gray-900 dark:text-white">{value || '—'}</div>
  </div>
);

const StatsCard = ({ route }: { route: Route }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <IOSCard
      title="Statistiky trasy"
      subtitle="Přehled základních údajů o trase"
      icon={<BarChart className="h-5 w-5" />}
      iconBackground="bg-purple-100 dark:bg-purple-500/20"
      iconColor="text-purple-600 dark:text-purple-400"
      variant="elevated"
    >
      <div className="grid grid-cols-2 gap-6">
        <InfoSection
          label="Vzdálenost"
          value={`${route.extraPoints?.distance?.toFixed(2) || '0'} km`}
        />
        <InfoSection
          label="Převýšení"
          value={`${route.extraPoints?.totalAscent?.toFixed(0) || '0'} m`}
        />
        <InfoSection
          label="Čas"
          value={formatDuration(route.extraPoints?.elapsedTime || 0)}
        />
        <InfoSection
          label="Průměrná rychlost"
          value={`${route.extraPoints?.averageSpeed?.toFixed(1) || '0'} km/h`}
        />
      </div>
    </IOSCard>
  );
};

const RouteDetailsCard = ({ route, dogNotAllowed }: { route: Route; dogNotAllowed: string }) => (
  <IOSCard
    title="Základní informace"
    subtitle="Detaily o trase"
    icon={<BarChart className="h-5 w-5" />}
    iconBackground="bg-purple-100 dark:bg-purple-500/20"
    iconColor="text-purple-600 dark:text-purple-400"
    variant="elevated"
  >
    <div className="space-y-6">
      <InfoSection
        label="Název trasy"
        value={route.routeTitle}
      />
      <InfoSection
        label="Datum absolvování"
        value={route.visitDate ? new Date(route.visitDate).toLocaleDateString('cs-CZ', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : '—'}
      />
      <div className="space-y-1">
        <div className="text-sm text-gray-500 dark:text-gray-400">Popis trasy</div>
        <div className="text-base text-gray-900 dark:text-white whitespace-pre-wrap">
          {route.routeDescription || '—'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm text-gray-500 dark:text-gray-400">Zákaz vstupu se psy:</div>
        <div className={cn(
          "text-sm font-medium px-2 py-0.5 rounded-full",
          dogNotAllowed === "true"
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        )}>
          {dogNotAllowed === "true" ? "Ano" : "Ne"}
        </div>
      </div>
    </div>
  </IOSCard>
);

export default function FinishRoutePage() {
  const params = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const user = useCurrentUser();
  const role = useCurrentRole();
  const [routeTitle, setRouteTitle] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [dogNotAllowed, setDogNotAllowed] = useState('false');
  const [visitDate, setVisitDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        // First try to get data from sessionStorage
        const storedData = sessionStorage.getItem('routeData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setRouteTitle(parsedData.routeTitle || '');
          setRouteDescription(parsedData.routeDescription || '');
          setDogNotAllowed(parsedData.dogNotAllowed || 'false');
          setVisitDate(parsedData.visitDate ? new Date(parsedData.visitDate) : null);
        }

        const response = await fetch(`/api/visitData/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch route');
        const data = await response.json();

        // Parse the track data properly
        let trackPoints = [];
        try {
          trackPoints = data.routeLink ? JSON.parse(data.routeLink) : [];
        } catch (e) {
          console.error('Failed to parse track data:', e);
          trackPoints = [];
        }

        // If we didn't get data from sessionStorage, use the API data
        if (!storedData) {
          setRouteTitle(data.routeTitle || '');
          setRouteDescription(data.routeDescription || '');
          setDogNotAllowed(data.dogNotAllowed || 'false');
          setVisitDate(data.visitDate ? new Date(data.visitDate) : null);
        }

        setRoute({
          id: data.id,
          routeTitle: data.routeTitle || '',
          routeDescription: data.routeDescription || '',
          routeLink: data.routeLink || '',
          track: trackPoints,
          displayTrack: trackPoints && trackPoints.length > 0 ? downsampleTrack(trackPoints) : [],
          visitDate: data.visitDate ? new Date(data.visitDate) : null,
          extraPoints: data.extraPoints || {
            distance: 0,
            totalAscent: 0,
            elapsedTime: 0,
            averageSpeed: 0,
            difficulty: 1
          },
          photos: data.photos || []
        });

        // Clear the sessionStorage after using it
        sessionStorage.removeItem('routeData');
      } catch (err) {
        setError('Failed to load route');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [params.id]);

  const handleSave = async () => {
    if (!route) return;

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/visitData/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeTitle,
          routeDescription,
          dogNotAllowed,
          visitDate: visitDate?.toISOString(),
          routeLink: JSON.stringify(route.track),
          extraPoints: {
            ...route.extraPoints,
            distance: route.extraPoints?.distance || 0,
            totalAscent: route.extraPoints?.totalAscent || 0,
            elapsedTime: route.extraPoints?.elapsedTime || 0,
            averageSpeed: route.extraPoints?.averageSpeed || 0,
            difficulty: route.extraPoints?.difficulty || 1
          }
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) throw new Error(`Failed to save route: ${responseData?.message || response.statusText}`);

      // Navigate to the results page
      router.push('/vysledky/moje');
    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to save route');
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
      <CommonPageTemplate contents={{ header: true }} currentUser={user} currentRole={role} className="px-6">
        <div className="container mx-auto py-6 space-y-6 max-w-5xl">
          <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid gap-6">
            <div className="h-[400px] bg-gray-200 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
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
    <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role} className="px-6">
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <IOSStepProgress
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <IOSCard
            title="Náhled trasy"
            subtitle="Finální podoba trasy"
            icon={<MapPin className="h-5 w-5" />}
            iconBackground="bg-blue-100 dark:bg-blue-500/20"
            iconColor="text-blue-600 dark:text-blue-400"
            variant="elevated"
          >
            <div className="h-[400px]">
              <DynamicGpxEditor
                initialTrack={route.track}
                onSave={() => { }}
                readOnly
                hideControls={['editMode', 'add', 'delete', 'undo', 'redo', 'simplify']}
              />
            </div>
          </IOSCard>

          <RouteDetailsCard route={route} dogNotAllowed={dogNotAllowed} />
          <StatsCard route={route} />

          <IOSCard
            title="Fotografie"
            subtitle="Fotografie z trasy"
            icon={<Camera className="w-5 h-5" />}
            iconBackground="bg-amber-100 dark:bg-amber-500/20"
            iconColor="text-amber-600 dark:text-amber-400"
            variant="elevated"
          >
            <IOSImageShowcase
              images={route?.photos?.map(img => ({ url: img.url, alt: img.title, title: img.title })) || []}
              layout="grid"
              aspectRatio="square"
              className="mt-4"
            />
          </IOSCard>
        </div>

        <div className="flex justify-end gap-4">
          <IOSButton
            variant="blue"
            size="lg"
            onClick={handleSave}
            disabled={isPublishing}
            loading={isPublishing}
            icon={<Send className="h-5 w-5" />}
          >
            Odeslat ke schválení
          </IOSButton>
        </div>
      </div>
    </CommonPageTemplate>
  );
}