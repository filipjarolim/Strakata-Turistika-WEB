'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    Save,
    Plus,
    Trash2,
    Mountain,
    Eye,
    TreeDeciduous,
    Castle,
    Sparkles,
    MapPin,
    AlertCircle,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoringConfig {
    id: string;
    pointsPerKm: number;
    minDistanceKm: number;
    requireAtLeastOnePlace: boolean;
    placeTypePoints: Record<string, number>;
}

interface PlaceTypeConfig {
    id: string;
    name: string;
    label: string;
    icon: string;
    points: number;
    color: string;
    isActive: boolean;
    order: number;
}

import { type LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    Mountain: Mountain,
    Eye: Eye,
    TreeDeciduous: TreeDeciduous,
    Castle: Castle,
    Sparkles: Sparkles,
    MapPin: MapPin,
    terrain: Mountain,
    attractions: Eye,
    park: TreeDeciduous,
    castle: Castle,
    star: Sparkles,
    place: MapPin
};

export default function ScoringClient() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<ScoringConfig | null>(null);
    const [placeTypes, setPlaceTypes] = useState<PlaceTypeConfig[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [configRes, typesRes] = await Promise.all([
                fetch('/api/scoring-config'),
                fetch('/api/place-type-configs')
            ]);

            if (configRes.ok && typesRes.ok) {
                const configData = await configRes.json();
                const typesData = await typesRes.json();
                setConfig(configData);
                setPlaceTypes(typesData);
            } else {
                toast({
                    title: "Chyba",
                    description: "Nepodařilo se načíst konfiguraci.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Error fetching scoring data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSaveConfig = () => {
        if (!config) return;

        startTransition(async () => {
            try {
                const res = await fetch('/api/scoring-config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });

                if (res.ok) {
                    toast({
                        title: "Uloženo",
                        description: "Základní konfigurace byla úspěšně uložena.",
                        variant: "success"
                    });
                } else {
                    throw new Error("Failed to save config");
                }
            } catch (error) {
                toast({
                    title: "Chyba",
                    description: "Nepodařilo se uložit konfiguraci.",
                    variant: "destructive"
                });
            }
        });
    };

    const handleSavePlaceType = (type: PlaceTypeConfig) => {
        startTransition(async () => {
            try {
                const res = await fetch(`/api/place-type-configs/${type.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(type)
                });

                if (res.ok) {
                    toast({
                        title: "Aktualizováno",
                        description: `Typ místa ${type.label} byl aktualizován.`,
                        variant: "success"
                    });
                    // Also update the local scoring config if needed
                    if (config) {
                        const newPlaceTypePoints = { ...config.placeTypePoints, [type.name]: type.points };
                        setConfig({ ...config, placeTypePoints: newPlaceTypePoints });
                    }
                    fetchData();
                } else {
                    throw new Error("Failed to save place type");
                }
            } catch (error) {
                toast({
                    title: "Chyba",
                    description: "Nepodařilo se uložit typ místa.",
                    variant: "destructive"
                });
            }
        });
    };

    const handleDeletePlaceType = (id: string) => {
        if (!confirm("Opravdu chcete smazat tento typ místa?")) return;

        startTransition(async () => {
            try {
                const res = await fetch(`/api/place-type-configs/${id}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    toast({
                        title: "Smazáno",
                        description: "Typ místa byl smazán.",
                        variant: "success"
                    });
                    fetchData();
                } else {
                    throw new Error("Failed to delete");
                }
            } catch (error) {
                toast({
                    title: "Chyba",
                    description: "Nepodařilo se smazat typ místa.",
                    variant: "destructive"
                });
            }
        });
    };

    const handleCreatePlaceType = () => {
        const id = prompt("Zadejte technické ID (např. RUINS):");
        if (!id) return;

        const label = prompt("Zadejte název pro lidi (např. Zřícenina):");
        if (!label) return;

        startTransition(async () => {
            try {
                const res = await fetch('/api/place-type-configs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: id.toUpperCase(),
                        name: id.toUpperCase(),
                        label,
                        icon: 'place',
                        points: 1,
                        color: '#9E9E9E'
                    })
                });

                if (res.ok) {
                    toast({
                        title: "Vytvořeno",
                        description: "Nový typ místa byl vytvořen.",
                        variant: "success"
                    });
                    fetchData();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to create");
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Nepodařilo se vytvořit typ místa.";
                toast({
                    title: "Chyba",
                    description: message,
                    variant: "destructive"
                });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-muted-foreground animate-pulse">Načítání konfigurace...</p>
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            {/* Basics */}
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black">Základní metriky</CardTitle>
                            <CardDescription>Základní pravidla výpočtu bodů</CardDescription>
                        </div>
                        <Button
                            onClick={handleSaveConfig}
                            disabled={isPending}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Uložit základní nastavení
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Body za kilometr</label>
                        <div className="relative">
                            <Input
                                type="number"
                                step="0.1"
                                value={config.pointsPerKm}
                                onChange={(e) => setConfig({ ...config, pointsPerKm: parseFloat(e.target.value) })}
                                className="h-12 bg-white rounded-xl border-gray-100 text-lg font-bold pl-4"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">pts/km</div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-sm font-bold uppercase tracking-wider text-gray-400">Min. délka trasy</label>
                        <div className="relative">
                            <Input
                                type="number"
                                step="0.1"
                                value={config.minDistanceKm}
                                onChange={(e) => setConfig({ ...config, minDistanceKm: parseFloat(e.target.value) })}
                                className="h-12 bg-white rounded-xl border-gray-100 text-lg font-bold pl-4"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">km</div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-end pb-2">
                        <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <Checkbox
                                id="requirePlace"
                                checked={config.requireAtLeastOnePlace}
                                onCheckedChange={(checked) => setConfig({ ...config, requireAtLeastOnePlace: !!checked })}
                            />
                            <label htmlFor="requirePlace" className="text-sm font-semibold cursor-pointer select-none">
                                Vyžadovat alespoň jedno místo
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Place Types */}
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-emerald-900 leading-none">Typy míst</CardTitle>
                            <CardDescription>Definice navštěvovaných míst a jejich bodové ohodnocení</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleCreatePlaceType}
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Přidat typ místa
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-emerald-100">
                                <TableHead className="w-[100px] font-bold text-gray-400">IKONA</TableHead>
                                <TableHead className="font-bold text-gray-400">NÁZEV (ID)</TableHead>
                                <TableHead className="w-[150px] font-bold text-gray-400">BODY</TableHead>
                                <TableHead className="w-[100px] font-bold text-gray-400">STAV</TableHead>
                                <TableHead className="text-right font-bold text-gray-400">AKCE</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {placeTypes.map((type) => {
                                const IconComp = ICON_MAP[type.icon] || MapPin;
                                return (
                                    <TableRow key={type.id} className="hover:bg-emerald-50/30 border-emerald-50 transition-colors">
                                        <TableCell>
                                            <div className={cn("p-2 rounded-lg bg-white inline-flex shadow-sm", type.color)}>
                                                <IconComp className="w-5 h-5" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Input
                                                    value={type.label}
                                                    onChange={(e) => {
                                                        const newTypes = placeTypes.map(t => t.id === type.id ? { ...t, label: e.target.value } : t);
                                                        setPlaceTypes(newTypes);
                                                    }}
                                                    className="h-8 border-transparent hover:border-gray-100 bg-transparent font-bold p-0 focus-visible:ring-0"
                                                />
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                value={type.points}
                                                onChange={(e) => {
                                                    const newTypes = placeTypes.map(t => t.id === type.id ? { ...t, points: parseFloat(e.target.value) } : t);
                                                    setPlaceTypes(newTypes);
                                                }}
                                                className="h-9 w-20 text-center font-bold rounded-lg border-gray-100"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Checkbox
                                                checked={type.isActive}
                                                onCheckedChange={(checked) => {
                                                    const updated = { ...type, isActive: !!checked };
                                                    handleSavePlaceType(updated);
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleSavePlaceType(type)}
                                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <Save className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDeletePlaceType(type.id)}
                                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Special Bonuses (Read-only for now) */}
            <Card className="border-none shadow-xl bg-gray-50/50">
                <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Speciální bonusy
                    </CardTitle>
                    <CardDescription>Aktuálně pevně nastavené bonusy (připraveno na budoucí správu)</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Téma měsíce</h4>
                                <p className="text-xs text-muted-foreground">Bonus za splnění měsíčního tématu</p>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-amber-600">5 <span className="text-xs uppercase">body</span></div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between opacity-50 cursor-not-allowed">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Strakatá trasa (TBD)</h4>
                                <p className="text-xs text-muted-foreground">Bonus za vytvoření schválené trasy</p>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-blue-600">2 <span className="text-xs uppercase">body</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
