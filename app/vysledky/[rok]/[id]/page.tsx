'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import Link from 'next/link';
import { ChevronLeft, MapPin, Calendar, Award, Dog, Route, User, Clock, ArrowUpRight, LinkIcon } from 'lucide-react';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSBadge } from '@/components/ui/ios/badge';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import dynamic from 'next/dynamic';
import { VisitData } from '@/components/blocks/vysledky/DataTable';
import { CardContent } from '@/components/ui/card';

// Import GPX Editor dynamically to handle SSR
const DynamicGpxEditor = dynamic(
    () => import('@/components/editor/GpxEditor').then(mod => mod.default),
    { ssr: false }
);

// Add interface for photo
interface Photo {
  url: string;
  title?: string;
}

export default function VisitDetailPage() {
    const params = useParams();
    const user = useCurrentUser();
    const role = useCurrentRole();
    const [visitData, setVisitData] = useState<VisitData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVisitData = async () => {
            try {
                const response = await fetch(`/api/results/${params.rok}/${params.id}`);
                if (!response.ok) throw new Error('Failed to fetch visit data');
                const data = await response.json();
                setVisitData(data);
            } catch (err) {
                console.error('Error fetching visit data:', err);
                setError('Failed to load visit data');
            } finally {
                setLoading(false);
            }
        };

        fetchVisitData();
    }, [params.rok, params.id]);

    if (loading) {
        return (
            <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
                <div className="container mx-auto p-4 md:p-6 max-w-7xl">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                        <div className="h-8 w-64 bg-gray-200 rounded"></div>
                        <div className="space-y-3">
                            <div className="h-48 bg-gray-200 rounded"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="h-32 bg-gray-200 rounded"></div>
                                <div className="h-32 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </CommonPageTemplate>
        );
    }

    if (error || !visitData) {
        return (
            <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
                <div className="container mx-auto p-4 md:p-6 max-w-7xl">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Chyba při načítání dat</h2>
                        <p className="text-gray-500 mt-2">{error || 'Data nejsou k dispozici'}</p>
                        <Link href={`/vysledky/${params.rok}`} className="mt-4 inline-block">
                            <IOSButton>Zpět na přehled</IOSButton>
                        </Link>
                    </div>
                </div>
            </CommonPageTemplate>
        );
    }

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
                {/* Navigation */}
                <Link 
                    href={`/vysledky/${params.rok}`} 
                    className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" /> Zpět na přehled sezóny
                </Link>

                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">
                                {visitData.routeTitle}
                            </h1>
                            {visitData.routeDescription && (
                                <p className="text-gray-500 mt-2">
                                    {visitData.routeDescription}
                                </p>
                            )}
                        </div>
                        <IOSBadge
                            label={`${visitData.points} bodů`}
                            bgColor="bg-blue-100"
                            textColor="text-blue-900"
                            borderColor="border-blue-200"
                            size="lg"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <IOSBadge
                            label={visitData.visitDate ? format(new Date(visitData.visitDate), 'd. MMMM yyyy', { locale: cs }) : 'Datum neznámé'}
                            icon={<Calendar className="h-4 w-4" />}
                            bgColor="bg-gray-100"
                            textColor="text-gray-900"
                        />
                        {visitData.user?.name && (
                            <IOSBadge
                                label={visitData.user.name}
                                icon={<User className="h-4 w-4" />}
                                bgColor="bg-gray-100"
                                textColor="text-gray-900"
                            />
                        )}
                        {visitData.dogName && (
                            <IOSBadge
                                label={visitData.dogName}
                                icon={<Dog className="h-4 w-4" />}
                                bgColor="bg-gray-100"
                                textColor="text-gray-900"
                            />
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                    {/* Map and Route Details */}
                    <div className="space-y-6">
                        {/* Map */}
                        <IOSCard className="overflow-hidden">
                            <div className="aspect-video">
                                {visitData?.route ? (
                                    <DynamicGpxEditor
                                        onSave={() => {}}
                                        initialTrack={JSON.parse(visitData.route)}
                                        readOnly={true}
                                        hideControls={['editMode', 'undo', 'redo', 'add', 'delete', 'simplify']}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                        <p className="text-gray-500">Trasa není k dispozici</p>
                                    </div>
                                )}
                            </div>
                        </IOSCard>

                        {/* Route Stats */}
                        {visitData?.extraPoints && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                                <IOSCard>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            {(visitData.extraPoints.distance || 0).toFixed(2)} km
                                        </div>
                                        <p className="text-muted-foreground text-sm">Vzdálenost</p>
                                    </CardContent>
                                </IOSCard>
                                <IOSCard>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            {(visitData.extraPoints.elapsedTime || 0).toFixed(2)} h
                                        </div>
                                        <p className="text-muted-foreground text-sm">Čas</p>
                                    </CardContent>
                                </IOSCard>
                                <IOSCard>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            {(visitData.extraPoints.averageSpeed || 0).toFixed(2)} km/h
                                        </div>
                                        <p className="text-muted-foreground text-sm">Průměrná rychlost</p>
                                    </CardContent>
                                </IOSCard>
                                <IOSCard>
                                    <CardContent className="pt-6">
                                        <div className="text-2xl font-bold">
                                            {visitData.points || 0} bodů
                                        </div>
                                        <p className="text-muted-foreground text-sm">Body</p>
                                    </CardContent>
                                </IOSCard>
                            </div>
                        )}
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Visited Places */}
                        <IOSCard>
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                    <h3 className="font-medium">Navštívená místa</h3>
                                </div>
                                <div className="space-y-2">
                                    {visitData.visitedPlaces.split(',').map((place, index) => (
                                        <IOSBadge
                                            key={index}
                                            label={place.trim()}
                                            bgColor="bg-blue-50"
                                            textColor="text-blue-900"
                                            className="block"
                                        />
                                    ))}
                                </div>
                            </div>
                        </IOSCard>

                        {/* Photos */}
                        {visitData.photos && visitData.photos.length > 0 && (
                            <IOSCard>
                                <div className="p-4">
                                    <h3 className="font-medium mb-4">Fotografie</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {visitData.photos.map((photo: Photo, index: number) => (
                                            <img
                                                key={index}
                                                src={photo.url}
                                                alt={photo.title || `Photo ${index + 1}`}
                                                className="rounded-lg object-cover aspect-square"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </IOSCard>
                        )}

                        {/* External Route Link */}
                        {visitData?.routeLink && (
                            <a 
                                href={visitData.routeLink || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                                <LinkIcon className="h-4 w-4" />
                                Zobrazit trasu
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </CommonPageTemplate>
    );
} 