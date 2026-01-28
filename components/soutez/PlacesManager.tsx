'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Mountain, Eye, TreeDeciduous, AlertCircle } from 'lucide-react';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSSelect } from '@/components/ui/ios/select';
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { ProofTypeSelector } from '@/components/soutez/ProofTypeSelector';
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

export enum PlaceType {
  PEAK = 'PEAK',
  TOWER = 'TOWER',
  TREE = 'TREE',
  OTHER = 'OTHER'
}

export interface PlacePhoto {
  id: string;
  url: string;
  public_id?: string;
  title?: string;
  description?: string; // Description of THIS specific photo
  uploadedAt: string;
  isLocal: boolean;
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  lat?: number;
  lng?: number;
  proofType?: 'STANDARD' | 'PEAK' | 'VOLNÁ';
  photos: PlacePhoto[];
  description: string;
  createdAt: string;
}

interface PlaceTypeConfig {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  points: number;
  isActive: boolean;
  order: number;
}

interface PlacesManagerProps {
  places: Place[];
  onChange: (places: Place[]) => void;
  dark?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'Mountain': Mountain,
  'Eye': Eye,
  'TreeDeciduous': TreeDeciduous,
  'MapPin': MapPin,
};

export default function PlacesManager({ places, onChange, dark = false }: PlacesManagerProps) {
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [placeTypes, setPlaceTypes] = useState<PlaceTypeConfig[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  // Load place types from API
  useEffect(() => {
    const loadPlaceTypes = async () => {
      try {
        const response = await fetch('/api/place-type-configs');
        if (response.ok) {
          const types = await response.json();
          // Filter only active types
          const activeTypes = types.filter((t: PlaceTypeConfig) => t.isActive !== false);
          setPlaceTypes(activeTypes);
        } else {
          // Fallback to default types
          setPlaceTypes([
            { id: 'PEAK', name: 'PEAK', label: 'Vrchol', icon: 'Mountain', color: 'text-blue-500', points: 5.0, isActive: true, order: 0 },
            { id: 'TOWER', name: 'TOWER', label: 'Rozhledna', icon: 'Eye', color: 'text-purple-500', points: 3.0, isActive: true, order: 1 },
            { id: 'TREE', name: 'TREE', label: 'Strom', icon: 'TreeDeciduous', color: 'text-green-500', points: 2.0, isActive: true, order: 2 },
            { id: 'OTHER', name: 'OTHER', label: 'Jiné', icon: 'MapPin', color: 'text-orange-500', points: 1.0, isActive: true, order: 3 },
          ]);
        }
      } catch (error) {
        console.error('Failed to load place types:', error);
        // Fallback to default
        setPlaceTypes([
          { id: 'PEAK', name: 'PEAK', label: 'Vrchol', icon: 'Mountain', color: 'text-blue-500', points: 5.0, isActive: true, order: 0 },
          { id: 'TOWER', name: 'TOWER', label: 'Rozhledna', icon: 'Eye', color: 'text-purple-500', points: 3.0, isActive: true, order: 1 },
          { id: 'TREE', name: 'TREE', label: 'Strom', icon: 'TreeDeciduous', color: 'text-green-500', points: 2.0, isActive: true, order: 2 },
          { id: 'OTHER', name: 'OTHER', label: 'Jiné', icon: 'MapPin', color: 'text-orange-500', points: 1.0, isActive: true, order: 3 },
        ]);
      } finally {
        setIsLoadingTypes(false);
      }
    };

    loadPlaceTypes();
  }, []);

  const handleAddPlace = () => {
    const newPlace: Place = {
      id: uuidv4(),
      name: '',
      type: PlaceType.PEAK,
      photos: [],
      description: '',
      createdAt: new Date().toISOString(),
    };
    onChange([...places, newPlace]);
    setEditingPlaceId(newPlace.id);
  };

  const handleDeletePlace = (placeId: string) => {
    onChange(places.filter(p => p.id !== placeId));
    if (editingPlaceId === placeId) {
      setEditingPlaceId(null);
    }
  };

  const handleUpdatePlace = (placeId: string, updates: Partial<Place>) => {
    onChange(places.map(p => p.id === placeId ? { ...p, ...updates } : p));
  };

  const handleImageUpload = async (placeId: string, file: File, title: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    const place = places.find(p => p.id === placeId);
    if (!place) return;

    const newPhoto: PlacePhoto = {
      id: uuidv4(),
      url: data.url,
      public_id: data.public_id,
      title: data.title,
      description: '',
      uploadedAt: new Date().toISOString(),
      isLocal: false,
    };

    handleUpdatePlace(placeId, {
      photos: [...place.photos, newPhoto],
    });
  };

  const handleImageDelete = async (placeId: string, photoId: string) => {
    const place = places.find(p => p.id === placeId);
    if (!place) return;

    handleUpdatePlace(placeId, {
      photos: place.photos.filter(photo => photo.id !== photoId),
    });
  };

  const getPlaceTypeIcon = (type: PlaceType) => {
    const config = placeTypes.find(pt => pt.name === type);
    if (!config) return <MapPin className="h-5 w-5 text-gray-500" />;

    const IconComponent = ICON_MAP[config.icon] || MapPin;
    return <IconComponent className={cn("h-5 w-5", config.color)} />;
  };

  const handleUpdatePhotoDescription = (placeId: string, photoId: string, description: string) => {
    const place = places.find(p => p.id === placeId);
    if (!place) return;

    handleUpdatePlace(placeId, {
      photos: place.photos.map(photo =>
        photo.id === photoId ? { ...photo, description } : photo
      ),
    });
  };

  return (
    <div className="space-y-4">
      {places.length === 0 ? (
        <div className={cn(
          "text-center py-8 rounded-lg border-2 border-dashed",
          dark ? "border-white/20 text-white/70" : "border-gray-300 text-gray-500"
        )}>
          <MapPin className={cn("h-12 w-12 mx-auto mb-3", dark ? "text-white/40" : "text-gray-400")} />
          <p className="text-sm mb-4">Zatím jste nepřidali žádná bodovaná místa</p>
          <IOSButton
            variant="blue"
            size="md"
            onClick={handleAddPlace}
            icon={<Plus className="h-4 w-4" />}
            className="px-8 rounded-full shadow-lg shadow-blue-500/20"
          >
            Přidat první místo
          </IOSButton>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {places.map((place, index) => (
              <IOSCard
                key={place.id}
                title={place.name || `Místo ${index + 1}`}
                subtitle={placeTypes.find(pt => pt.name === place.type)?.label || ''}
                icon={getPlaceTypeIcon(place.type)}
                iconBackground={dark ? "bg-blue-900/40" : "bg-blue-100"}
                iconColor={dark ? "text-blue-300" : "text-blue-600"}
                variant="elevated"
                className={cn(
                  "p-4 sm:p-6",
                  dark && "bg-black/40 backdrop-blur-sm border border-white/20 text-white"
                )}
                titleClassName={cn("text-base sm:text-lg", dark && "text-white")}
                subtitleClassName={cn("text-xs sm:text-sm", dark && "text-white/70")}
              >
                <div className="space-y-8">
                  {/* SECTION 1: IDENTITY */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-blue-500 rounded-full" />
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", dark ? "text-blue-400" : "text-blue-600")}>Základní informace</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <IOSTextInput
                        label="Název místa"
                        placeholder="např. Sněžka"
                        value={place.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleUpdatePlace(place.id, { name: e.target.value })
                        }
                        dark={dark}
                      />

                      <div className="space-y-1.5">
                        <label className={cn(
                          "text-sm font-medium",
                          dark ? "text-white/90" : "text-gray-700"
                        )}>
                          Typ místa
                        </label>
                        <IOSSelect
                          value={place.type}
                          onChange={(value: string) => handleUpdatePlace(place.id, { type: value as PlaceType })}
                          options={placeTypes.map(pt => ({
                            value: pt.name,
                            label: `${pt.label} (+${pt.points} ${pt.points === 1 ? 'bod' : pt.points < 5 ? 'body' : 'bodů'})`,
                          }))}
                          placeholder="Vyberte typ"
                          dark={dark}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PROOF & LOCATION */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-amber-500 rounded-full" />
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", dark ? "text-amber-400" : "text-amber-600")}>Doložení a Poloha</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className={cn("text-sm font-medium", dark ? "text-white/90" : "text-gray-700")}>
                          Typ doložení
                        </label>
                        <IOSSelect
                          value={place.proofType || 'STANDARD'}
                          onChange={(value: string) => handleUpdatePlace(place.id, { proofType: value as 'STANDARD' | 'PEAK' | 'VOLNÁ' })}
                          options={[
                            { value: 'STANDARD', label: 'Standardní (foto s označníkem)' },
                            { value: 'PEAK', label: 'Vrchol (foto s výhledem/mapou)' },
                            { value: 'VOLNÁ', label: 'Volná (bez omezení stezky)' }
                          ]}
                          dark={dark}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className={cn("text-sm font-medium", dark ? "text-white/90" : "text-gray-700")}>
                            GPS Souřadnice
                          </label>
                          <button
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                  handleUpdatePlace(place.id, {
                                    lat: pos.coords.latitude,
                                    lng: pos.coords.longitude
                                  });
                                });
                              }
                            }}
                            className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                          >
                            Použít moji polohu
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <IOSTextInput
                            placeholder="Zeměpisná šířka (Lat)"
                            type="number"
                            value={place.lat || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdatePlace(place.id, { lat: parseFloat(e.target.value) })}
                            dark={dark}
                          />
                          <IOSTextInput
                            placeholder="Zeměpisná délka (Lng)"
                            type="number"
                            value={place.lng || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdatePlace(place.id, { lng: parseFloat(e.target.value) })}
                            dark={dark}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: DETAILS & PHOTOS */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", dark ? "text-emerald-400" : "text-emerald-600")}>Popis a Fotografie</h4>
                    </div>

                    <div className="space-y-1.5">
                      <label className={cn(
                        "text-sm font-medium",
                        dark ? "text-white/90" : "text-gray-700"
                      )}>
                        Vlastní popis místa
                      </label>
                      <IOSTextarea
                        placeholder="Popište místo, náročnost, nebo zajímavosti..."
                        value={place.description}
                        onChange={(value: string) => handleUpdatePlace(place.id, { description: value })}
                        colors={dark ? {
                          background: 'bg-black/40 backdrop-blur-sm',
                          text: 'text-white',
                          placeholder: 'text-white/40',
                          border: 'border-white/20',
                          focus: 'border-blue-400'
                        } : undefined}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={cn(
                        "text-sm font-medium",
                        dark ? "text-white/90" : "text-gray-700"
                      )}>
                        Fotografie (důkaz o návštěvě)
                      </label>
                      <EnhancedImageUpload
                        sources={place.photos.map(photo => ({
                          url: photo.url,
                          public_id: photo.public_id || '',
                          title: photo.title || '',
                        }))}
                        onUpload={(file, title) => handleImageUpload(place.id, file, title)}
                        onDelete={async (public_id) => {
                          const photo = place.photos.find(p => p.public_id === public_id);
                          if (photo) await handleImageDelete(place.id, photo.id);
                        }}
                        stackingStyle="grid"
                        aspectRatio="landscape"
                        count={5}
                        dark={dark}
                      />

                      {/* Photo descriptions */}
                      {place.photos.length > 0 && (
                        <div className="space-y-3 mt-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                          <label className={cn(
                            "text-[10px] font-bold uppercase tracking-widest opacity-50",
                            dark ? "text-white" : "text-gray-900"
                          )}>
                            Popisy fotografií
                          </label>
                          {place.photos.map((photo, photoIdx) => (
                            <div key={photo.id} className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.url}
                                  alt={`Foto ${photoIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <IOSTextInput
                                placeholder={`Popis fotky ${photoIdx + 1}`}
                                value={photo.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleUpdatePhotoDescription(place.id, photo.id, e.target.value)
                                }
                                dark={dark}
                                className="flex-1 h-10 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/5">
                    <IOSButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlace(place.id)}
                      icon={<Trash2 className="h-4 w-4" />}
                      className={cn(
                        "text-red-500 border-red-500/20 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all rounded-xl",
                        dark ? "bg-red-500/10" : "bg-red-50"
                      )}
                    >
                      Smazat místo
                    </IOSButton>
                  </div>
                </div>
              </IOSCard>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <IOSButton
              variant="blue"
              size="lg"
              onClick={handleAddPlace}
              icon={<Plus className="h-5 w-5" />}
              className="px-12 py-6 text-lg rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Přidat další místo
            </IOSButton>
          </div>
        </>
      )}

      {places.length > 0 && places.some(p => !p.name.trim()) && (
        <div className={cn(
          "flex items-center gap-4 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300",
          dark ? "bg-red-500/10 border border-red-500/20 text-red-200" : "bg-red-50 border border-red-100 text-red-900"
        )}>
          <div className={cn(
            "p-2 rounded-full",
            dark ? "bg-red-500/20" : "bg-white shadow-sm"
          )}>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm font-semibold tracking-tight">
            Vyplňte prosím názvy všech míst před pokračováním
          </p>
        </div>
      )}
    </div>
  );
}



