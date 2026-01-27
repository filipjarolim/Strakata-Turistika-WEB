import React, { useState, useEffect } from 'react';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { IOSCalendar } from '@/components/ui/ios/calendar';
import { Camera, MapPin, Mountain, Info, BarChart, FileText, Calendar, TrendingUp, Check, Upload, ChevronDown, AlertCircle } from 'lucide-react';
import PlacesManager, { Place } from '@/components/soutez/PlacesManager';
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const DynamicGpxEditor = dynamic(
    () => import('@/components/editor/GpxEditor').then(mod => mod.default),
    { ssr: false }
);

interface Field {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    order: number;
    options?: { label: string; value: string }[];
}

interface Step {
    id: string;
    title: string;
    fields: Field[];
}

interface FormDefinition {
    steps: Step[];
}

export interface FormRendererContext {
    route?: {
        track?: any[];
        routeTitle?: string;
        routeDescription?: string;
        visitDate?: Date | null;
        dogNotAllowed?: boolean;
        extraPoints?: any;
    };
    photos?: any[];
    places?: Place[];
    onPhotosChange?: (photos: any[]) => void;
    onPlacesChange?: (places: Place[]) => void;
    onRouteUpdate?: (updates: any) => void;
    handleImageUpload?: (file: File, title: string) => Promise<void>;
    handleImageDelete?: (id: string) => Promise<void>;
    handleFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    selectedFile?: File | null;
}

interface FormRendererProps {
    slug: string; // Keep slug optional or handle logic inside
    stepId: string;
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    context?: FormRendererContext;
    dark?: boolean;
    directDefinition?: FormDefinition | null; // NEW: For preview mode
}

export default function FormRenderer({ slug, stepId, values, onChange, context, dark = false, directDefinition }: FormRendererProps) {
    const [definition, setDefinition] = useState<FormDefinition | null>(directDefinition || null);
    const [loading, setLoading] = useState(!directDefinition);

    useEffect(() => {
        if (directDefinition) {
            setDefinition(directDefinition);
            setLoading(false);
            return;
        }

        fetch(`/api/forms/${slug}`)
            .then(res => res.json())
            .then(data => {
                setDefinition(data.definition);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load form definition', err);
                setLoading(false);
            });
    }, [slug, directDefinition]);

    const handleChange = (name: string, value: unknown) => {
        onChange({ ...values, [name]: value });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white/50 text-sm font-medium">Načítání formuláře...</p>
        </div>
    );
    if (!definition) return null;

    const currentStep = definition.steps.find(s => s.id === stepId);
    if (!currentStep) return null;

    return (
        <div className="space-y-6">
            {currentStep.fields.sort((a, b) => a.order - b.order).map(field => {
                const val = values[field.name];

                // Standard Inputs
                if (field.type === 'text' || field.type === 'email') {
                    return (
                        <IOSTextInput
                            key={field.id}
                            label={field.label}
                            value={String(val ?? '')}
                            onChange={(e: any) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            dark={dark}
                            placeholder={(field as any).placeholder || ''}
                        />
                    );
                }

                if (field.type === 'number') {
                    return (
                        <IOSTextInput
                            key={field.id}
                            label={field.label}
                            type="number"
                            value={String(val ?? '')}
                            onChange={(e: any) => handleChange(field.name, parseFloat(e.target.value) || 0)}
                            required={field.required}
                            dark={dark}
                            placeholder={(field as any).placeholder || ''}
                        />
                    );
                }

                if (field.type === 'textarea') {
                    return (
                        <div key={field.id} className="space-y-2">
                            <label className="text-sm font-medium text-white/90">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <IOSTextarea
                                value={String(val ?? '')}
                                onChange={(v: string) => handleChange(field.name, v)}
                                colors={{
                                    background: dark ? 'bg-black/40' : 'bg-white',
                                    text: dark ? 'text-white' : 'text-gray-900',
                                    placeholder: dark ? 'text-white/40' : 'text-gray-500',
                                    border: dark ? 'border-zinc-800' : 'border-gray-300',
                                    focus: 'border-blue-500'
                                }}
                                placeholder={(field as any).placeholder || ''}
                            />
                        </div>
                    );
                }

                if (field.type === 'select') {
                    return (
                        <div key={field.id} className="space-y-2">
                            <label className="text-sm font-medium text-white/90">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <select
                                    value={String(val ?? '')}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    className={cn(
                                        "w-full appearance-none h-12 rounded-2xl px-4 text-sm font-medium focus:outline-none transition-all cursor-pointer border",
                                        dark ? "bg-black/40 text-white border-zinc-800 focus:border-blue-500" : "bg-white text-gray-900 border-gray-300 focus:border-blue-500"
                                    )}
                                >
                                    <option value="" disabled>Vyberte...</option>
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                            </div>
                        </div>
                    );
                }

                if (field.type === 'checkbox') {
                    return (
                        <div key={field.id} className="flex items-center justify-between py-4 px-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-white block">{field.label}</span>
                            </div>
                            <IOSSwitch
                                checked={Boolean(val)}
                                onCheckedChange={(checked) => handleChange(field.name, checked)}
                            />
                        </div>
                    );
                }

                if (field.type === 'date') {
                    return (
                        <IOSTextInput
                            key={field.id}
                            label={field.label}
                            type="date"
                            value={String(val ?? '')}
                            onChange={(e: any) => handleChange(field.name, e.target.value)}
                            required={field.required}
                            dark={dark}
                            icon={<Calendar className="w-4 h-4 text-amber-500" />}
                        />
                    );
                }

                // Specialized Widgets
                if (field.type === 'gpx_upload' && context) {
                    return (
                        <div key={field.id} className="space-y-4">
                            <label className="text-sm font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {field.label}
                            </label>
                            <label className={cn(
                                "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-3xl transition-all duration-300 group cursor-pointer",
                                context.selectedFile ? "bg-green-500/10 border-green-500/30" : "bg-black/40 border-white/10 hover:border-blue-500/50 hover:bg-black/50"
                            )}>
                                <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                                    <div className={cn(
                                        "p-3 rounded-full mb-2 transition-colors",
                                        context.selectedFile ? "bg-green-500/20" : "bg-white/10 group-hover:bg-blue-500/20"
                                    )}>
                                        {context.selectedFile ? <Check className="h-6 w-6 text-green-400" /> : <Upload className="h-6 w-6 text-white/70 group-hover:text-blue-400" />}
                                    </div>
                                    <p className="text-sm font-medium text-white">
                                        {context.selectedFile ? context.selectedFile.name : "Klikněte pro nahrání"}
                                    </p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">
                                        GPX, KML, TCX, CSV, GeoJSON
                                    </p>
                                </div>
                                <input type="file" className="hidden" onChange={context.handleFileChange} />
                            </label>
                            {context.route?.track && context.route.track.length > 0 && (
                                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                    <TrendingUp className="h-4 w-4 text-blue-400" />
                                    <span className="text-[11px] text-blue-100 font-medium">Nahráno {context.route.track.length} bodů trasy</span>
                                </div>
                            )}
                        </div>
                    );
                }

                if (field.type === 'map_preview' && context?.route?.track) {
                    return (
                        <div key={field.id} className="space-y-4">
                            <label className="text-sm font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> {field.label}
                            </label>
                            <div className="h-64 sm:h-96 rounded-3xl overflow-hidden border border-white/10 relative">
                                <DynamicGpxEditor
                                    initialTrack={context.route.track as any}
                                    onSave={() => { }}
                                    readOnly
                                    hideControls={['add', 'delete', 'undo', 'redo', 'simplify']}
                                />
                            </div>
                        </div>
                    );
                }

                if (field.type === 'image_upload' && context) {
                    return (
                        <div key={field.id} className="space-y-4">
                            <label className="text-sm font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-4 h-4" /> {field.label}
                            </label>
                            <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                                <EnhancedImageUpload
                                    sources={context.photos || []}
                                    onUpload={context.handleImageUpload!}
                                    onDelete={context.handleImageDelete!}
                                    stackingStyle="grid"
                                    aspectRatio="landscape"
                                    count={10}
                                />
                            </div>
                        </div>
                    );
                }

                if (field.type === 'places_manager' && context) {
                    return (
                        <div key={field.id} className="space-y-4">
                            <label className="text-sm font-semibold text-white/50 uppercase tracking-widest flex items-center gap-2">
                                <Mountain className="w-4 h-4" /> {field.label}
                            </label>
                            <PlacesManager
                                places={context.places || []}
                                onChange={context.onPlacesChange!}
                                dark={dark}
                            />
                        </div>
                    );
                }

                if (field.type === 'title_input' && context) {
                    return (
                        <IOSTextInput
                            key={field.id}
                            label={field.label || "Název trasy"}
                            value={context.route?.routeTitle || ''}
                            onChange={(e: any) => context.onRouteUpdate?.({ routeTitle: e.target.value })}
                            required={field.required}
                            dark={dark}
                            icon={<FileText className="w-4 h-4 text-blue-400" />}
                        />
                    );
                }

                if (field.type === 'description_input' && context) {
                    return (
                        <div key={field.id} className="space-y-2">
                            <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-400" /> {field.label || "Popis trasy"}
                            </label>
                            <IOSTextarea
                                value={context.route?.routeDescription || ''}
                                onChange={(v: string) => context.onRouteUpdate?.({ routeDescription: v })}
                                colors={{
                                    background: dark ? 'bg-black/40' : 'bg-white',
                                    text: dark ? 'text-white' : 'text-gray-900',
                                    placeholder: dark ? 'text-white/40' : 'text-gray-500',
                                    border: dark ? 'border-zinc-800' : 'border-gray-300',
                                    focus: 'border-blue-500'
                                }}
                            />
                        </div>
                    );
                }

                if (field.type === 'calendar' && context) {
                    return (
                        <div key={field.id} className="space-y-3">
                            <label className="text-sm font-medium text-white/90 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-400" /> {field.label || "Datum absolvování"}
                            </label>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <IOSCalendar
                                    selectedDate={context.route?.visitDate || new Date()}
                                    onDateChange={(date: Date) => context.onRouteUpdate?.({ visitDate: date })}
                                    className="w-full text-white"
                                />
                            </div>
                        </div>
                    );
                }

                if (field.type === 'dog_switch' && context) {
                    return (
                        <div key={field.id} className="flex items-center justify-between py-4 px-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-base font-medium text-white block">{field.label || "Zákaz vstupu se psy"}</span>
                                </div>
                                <span className="text-xs text-white/50 block ml-6">Bylo na trase nějaké omezení pro psy?</span>
                            </div>
                            <IOSSwitch
                                checked={context.route?.dogNotAllowed || false}
                                onCheckedChange={(checked) => context.onRouteUpdate?.({ dogNotAllowed: checked })}
                            />
                        </div>
                    );
                }

                if (field.type === 'route_summary' && context) {
                    // This is for the finish step typically
                    return (
                        <div key={field.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-blue-500/10 border border-blue-400/20 rounded-3xl p-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                                    <BarChart className="w-24 h-24" />
                                </div>
                                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Bodové hodnocení</h3>
                                <p className="text-xs text-blue-200/60 mb-6">Váš odhadovaný zisk bodů za tuto trasu</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black text-white italic">{(context.route?.extraPoints?.points || 0).toFixed(1)}</span>
                                    <span className="text-2xl font-bold text-blue-400 uppercase tracking-tighter">bodů</span>
                                </div>
                            </div>
                            {/* More statistics could follow based on your summary UI */}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
