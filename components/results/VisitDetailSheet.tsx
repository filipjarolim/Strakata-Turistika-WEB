'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  Camera, 
  ExternalLink, 
  Award,
  Users,
  Route,
  TrendingUp,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { VisitDataWithUser } from '@/lib/results-utils';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const VisitDetailMap = dynamic(() => import('./VisitDetailMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 flex items-center justify-center">Načítání mapy...</div>
});

interface VisitDetailSheetProps {
  visit: VisitDataWithUser | null;
  open: boolean;
  onClose: () => void;
}

interface ExtendedVisitData extends VisitDataWithUser {
  photos?: unknown;
  places?: unknown;
  route?: unknown;
  routeDescription?: string;
}

interface FullVisitData extends ExtendedVisitData {
  photos?: Array<{ url: string; public_id: string; title?: string }>;
  places?: Array<{ id: string; name: string; type: string; description?: string; photos?: Array<{ id: string; url: string; title?: string }> }>;
  route?: Record<string, unknown>;
}

export function VisitDetailSheet({ visit, open, onClose }: VisitDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [fullVisitData, setFullVisitData] = useState<FullVisitData | null>(null);
  
  // Reset tab when visit changes
  const loadFullVisitData = useCallback(async (visitId: string, visitYear?: number) => {
    try {
      setLoadingDetails(true);
      // Find the year from the visit data or use current year
      const year = visitYear || new Date().getFullYear();
      const response = await fetch(`/api/results/${year}/${visitId}`);
      if (response.ok) {
        const data = await response.json();
        setFullVisitData(data);
      }
    } catch (error) {
      console.error('Failed to load full visit data:', error);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (visit) {
      setActiveTab('info');
      // Only load if we don't have full data yet or visit changed
      if (open && visit.id && !fullVisitData) {
        loadFullVisitData(visit.id, visit.year);
      }
    }
  }, [visit, open, fullVisitData, loadFullVisitData]);

  if (!visit) return null;

  const extendedVisit = visit as ExtendedVisitData;
  const photos = fullVisitData?.photos || (extendedVisit?.photos as Array<{ url: string; public_id: string; title?: string }>) || [];
  const route = fullVisitData?.route || extendedVisit?.route as Record<string, unknown>;
  const extraPoints = extendedVisit?.extraPoints as { 
    distanceKm?: number; 
    durationMinutes?: number; 
    totalPoints?: number;
    distancePoints?: number;
    placePoints?: number;
  } | null;
  const places = fullVisitData?.places || (extendedVisit?.places as Array<{ id: string; name: string; type: string; description?: string; photos?: Array<{ id: string; url: string; title?: string }> }>) || [];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl sm:text-2xl truncate">
                {visit.routeTitle || 'Nepojmenovaná trasa'}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {visit.visitDate ? format(new Date(visit.visitDate), "d. MMM yyyy", { locale: cs }) : 'N/A'}
                </Badge>
                <Badge variant="default" className="bg-green-600">
                  {visit.points} bodů
                </Badge>
                <span className="text-sm text-muted-foreground">{visit.displayName}</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none justify-start px-6 border-b">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
            {photos.length > 0 && (
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Fotky</span>
                <Badge variant="secondary" className="ml-1">{photos.length}</Badge>
              </TabsTrigger>
            )}
            {places && places.length > 0 && (
              <TabsTrigger value="places" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                <span className="hidden sm:inline">Místa</span>
                <Badge variant="secondary" className="ml-1">{places.length}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6 mt-0">
                {/* Route Description */}
                 {extendedVisit.routeDescription && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      Popis trasy
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {extendedVisit.routeDescription}
                    </p>
                  </div>
                )}

                {/* Visited Places */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    Navštívená místa
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {visit.visitedPlaces.split(',').map((place: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {place.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Extra Information */}
                {extraPoints && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {extraPoints.distanceKm && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <TrendingUp className="h-4 w-4" />
                          Vzdálenost
                        </div>
                        <p className="text-lg font-bold">{extraPoints.distanceKm.toFixed(1)} km</p>
                      </div>
                    )}
                    {extraPoints.durationMinutes && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Clock className="h-4 w-4" />
                          Čas
                        </div>
                        <p className="text-lg font-bold">
                          {Math.floor(extraPoints.durationMinutes / 60)}h {Math.floor(extraPoints.durationMinutes % 60)}m
                        </p>
                      </div>
                    )}
                    {extraPoints.distancePoints && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Award className="h-4 w-4" />
                          Body za vzdálenost
                        </div>
                        <p className="text-lg font-bold">{extraPoints.distancePoints}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* User Info */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Uživatel
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Jméno:</span> {visit.displayName}
                    </p>
                    {visit.user?.dogName && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Pes:</span> {visit.user.dogName}
                      </p>
                    )}
                    {visit.dogNotAllowed === 'true' && (
                      <Badge variant="destructive" className="text-xs">
                        Psi zakázáni
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Route Link */}
                {visit.routeLink && (
                  <div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(visit.routeLink || '', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Zobrazit trasu na Mapy.cz
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Map Tab */}
              <TabsContent value="map" className="mt-0">
                <div className="h-[400px] sm:h-[500px] rounded-lg overflow-hidden border">
                  {loadingDetails ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-sm text-muted-foreground">Načítání mapy...</div>
                    </div>
                  ) : fullVisitData ? (
                    <VisitDetailMap visit={fullVisitData} />
                  ) : (
                    <VisitDetailMap visit={visit} />
                  )}
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-0">
                {photos.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Žádné fotky k zobrazení</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={photo.url}
                          alt={photo.title || `Foto ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        {photo.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                            {photo.title}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Places Tab */}
              <TabsContent value="places" className="mt-0">
                {!places || places.length === 0 ? (
                  <div className="text-center py-12">
                    <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Žádná místa k zobrazení</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {places.map((place, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {place.photos && place.photos.length > 0 && (
                            <img
                              src={place.photos[0].url}
                              alt={place.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{place.name}</h4>
                              {place.type && (
                                <Badge variant="outline" className="text-xs">
                                  {place.type}
                                </Badge>
                              )}
                            </div>
                            {place.description && (
                              <p className="text-sm text-muted-foreground">{place.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

