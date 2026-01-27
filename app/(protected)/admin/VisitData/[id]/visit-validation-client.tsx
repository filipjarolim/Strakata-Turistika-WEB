'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

interface VisitValidationClientProps {
    visit: { id: string; places: Record<string, unknown>[] };
}

interface ValidationPlace {
    id: string;
    type: string;
    name: string;
    trailValidation?: { approved: boolean; distance: number };
    photos?: { url: string }[];
}

export function VisitValidationClient({ visit }: VisitValidationClientProps) {
    const [places, setPlaces] = useState<ValidationPlace[]>(visit.places as unknown as ValidationPlace[] || []);
    const [isSaving, setIsSaving] = useState(false);

    const updatePlace = (placeId: string, updates: Record<string, unknown>) => {
        setPlaces(places.map(p =>
            p.id === placeId ? { ...p, ...updates } : p
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/visitData/${visit.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    places: places
                })
            });

            if (!res.ok) throw new Error('Failed to update visit');

            toast.success('Validation updated successfully');
        } catch (error) {
            toast.error('Failed to save validation');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const validationTargets = ['PEAK', 'RUINS', 'CAVE'];

    const placesToValidate = places.filter(p => validationTargets.includes(p.type));

    if (placesToValidate.length === 0) {
        return null;
    }

    return (
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                    Kontrola míst vyžadujících turistickou značku
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {placesToValidate.map((place) => (
                    <div key={place.id} className="bg-white dark:bg-black/20 p-4 rounded-xl border border-amber-500/10 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg">{place.name}</h3>
                                <p className="text-sm text-muted-foreground">Typ: {place.type}</p>
                            </div>
                            {place.trailValidation?.approved && (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            )}
                        </div>

                        {/* Photos */}
                        {place.photos && place.photos.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {place.photos.map((photo: { url: string }, idx: number) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={photo.url}
                                            alt={place.name}
                                            className="object-cover w-full h-full hover:scale-110 transition-transform cursor-pointer"
                                            onClick={() => window.open(photo.url, '_blank')}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Validation Controls */}
                        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-amber-500/20">
                            <div className="space-y-3">
                                <Label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-accent transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                        checked={place.trailValidation?.approved || false}
                                        onChange={(e) => updatePlace(place.id, {
                                            trailValidation: {
                                                ...place.trailValidation,
                                                approved: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="font-medium">Místo je na turistické značce</span>
                                </Label>
                            </div>

                            <div className="space-y-2">
                                <Label>Vzdálenost od značky (metry)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={place.trailValidation?.distance || 0}
                                        onChange={(e) => updatePlace(place.id, {
                                            trailValidation: {
                                                ...place.trailValidation,
                                                distance: parseInt(e.target.value) || 0
                                            }
                                        })}
                                        className={cn(
                                            (place.trailValidation?.distance || 0) > 50 ? "border-red-500 text-red-600" : ""
                                        )}
                                        max={100}
                                    />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">max 50 m</span>
                                </div>
                                {(place.trailValidation?.distance || 0) > 50 && (
                                    <p className="text-xs text-red-600 font-bold">
                                        ⚠️ Překročen limit 50 metrů!
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {isSaving ? (
                            "Ukládání..."
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Uložit validaci
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Helper utility (simplified version of cn from utils)
function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
