'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
    DragStartEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
    Plus,
    Trash2,
    GripVertical,
    Save,
    Type,
    Hash,
    Calendar,
    AlignLeft,
    CheckSquare,
    List,
    Settings2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    LayoutGrid,
    Mountain,
    BarChart,
    MapPin,
    Camera,
    Upload,
    Eye,
    EyeOff,
    MoreHorizontal,
    Copy
} from 'lucide-react';
import { cn } from "@/lib/utils";

import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AdminPageTemplate } from '@/components/admin/AdminPageTemplate';

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'map_preview' | 'image_upload' | 'places_manager' | 'route_summary' | 'title_input' | 'description_input' | 'calendar' | 'dog_switch' | 'gpx_upload';

interface Field {
    id: string;
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    order: number;

    placeholder?: string;
    description?: string; // New: Tooltip/Helper text
    options?: { label: string; value: string }[];
    validation?: { // New: Validation rules
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
    };
}

interface Step {
    id: string;
    title: string;
    description?: string;
    fields: Field[];
}

interface FormDefinition {
    steps: Step[];
}

interface FormConfig {
    id: string;
    slug: string;
    name: string;
    description: string;
    definition: FormDefinition;
}

import { type LucideIcon } from 'lucide-react'; // Add this if needed or checking existing import

const FIELD_TYPES: { type: FieldType; label: string; icon: LucideIcon; color: string }[] = [
    { type: 'text', label: 'Krátký text', icon: Type, color: 'text-blue-500 bg-blue-500/10' },
    { type: 'number', label: 'Číslo', icon: Hash, color: 'text-emerald-500 bg-emerald-500/10' },
    { type: 'date', label: 'Datum', icon: Calendar, color: 'text-amber-500 bg-amber-500/10' },
    { type: 'textarea', label: 'Dlouhý text', icon: AlignLeft, color: 'text-purple-500 bg-purple-500/10' },
    { type: 'checkbox', label: 'Zaškrtávací pole', icon: CheckSquare, color: 'text-rose-500 bg-rose-500/10' },
    { type: 'select', label: 'Výběr z menu', icon: List, color: 'text-indigo-500 bg-indigo-500/10' },
    { type: 'gpx_upload', label: '[WIDGET] GPX Dropzone', icon: Upload, color: 'text-blue-600 bg-blue-600/10' },
    { type: 'map_preview', label: '[WIDGET] Mapa trasy', icon: MapPin, color: 'text-orange-500 bg-orange-500/10' },
    { type: 'image_upload', label: '[WIDGET] Fotografie', icon: Camera, color: 'text-fuchsia-500 bg-fuchsia-500/10' },
    { type: 'places_manager', label: '[WIDGET] Bodovaná místa', icon: Mountain, color: 'text-green-500 bg-green-500/10' },
    { type: 'route_summary', label: '[FINISH] Souhrn a Statistiky', icon: BarChart, color: 'text-sky-500 bg-sky-500/10' },
    { type: 'title_input', label: '[SYS] Název trasy', icon: Type, color: 'text-blue-400 bg-blue-400/10' },
    { type: 'description_input', label: '[SYS] Popis trasy', icon: AlignLeft, color: 'text-blue-400 bg-blue-400/10' },
    { type: 'calendar', label: '[SYS] Kalendář návštěvy', icon: Calendar, color: 'text-orange-400 bg-orange-400/10' },
    { type: 'dog_switch', label: '[SYS] Přístup se psy', icon: AlertCircle, color: 'text-red-400 bg-red-400/10' },
];

const FORM_TYPES = [
    { slug: 'screenshot-upload', name: 'Screenshot Upload', description: 'Nahrávání obrázku z hodinek/aplikace' },
    { slug: 'gpx-upload', name: 'GPX Upload', description: 'Nahrávání GPX souboru s trasou' },
    { slug: 'gps-tracking', name: 'GPS Sledování', description: 'Záznam trasy přímo v aplikaci' },
];

const DEFAULT_STEPS = [
    { id: 'upload', title: 'Nahrát' },
    { id: 'edit', title: 'Upravit detaily' },
    { id: 'finish', title: 'Dokončit' },
];

import FormRenderer from '@/components/soutez/FormRenderer'; // Import Renderer

export default function FormBuilderClient() {
    const [activeFormSlug, setActiveFormSlug] = useState<string>('gpx-upload');
    const [forms, setForms] = useState<FormConfig[]>([]);
    const [currentConfig, setCurrentConfig] = useState<FormDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
    const [viewMode, setViewMode] = useState<'builder' | 'preview'>('builder'); // New: View Mode
    const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({}); // New: Preview State
    const [previewStep, setPreviewStep] = useState<string>('upload'); // New: Preview Step

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetch('/api/forms')
            .then(res => res.json())
            .then(data => {
                setForms(data);
                loadForm(activeFormSlug, data);
                setIsLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const loadForm = useCallback((slug: string, allForms: FormConfig[]) => {
        const selected = allForms.find((f) => f.slug === slug);

        if (selected) {
            const def = typeof selected.definition === 'string' ? JSON.parse(selected.definition) : selected.definition;

            // Ensure standard steps exist
            const existingStepIds = def.steps.map((s: { id: string }) => s.id);
            const stepsToAdd = DEFAULT_STEPS.filter(s => !existingStepIds.includes(s.id));

            if (stepsToAdd.length > 0) {
                def.steps = [...def.steps, ...stepsToAdd.map(s => ({ ...s, fields: [] }))];
            }

            setCurrentConfig(def);

            // Expand all by default
            const initialExpanded: Record<string, boolean> = {};
            def.steps.forEach((s: Step) => initialExpanded[s.id] = true);
            setExpandedSteps(initialExpanded);
        } else {
            // Create a default empty config if not found (should ideally be handled by API too)
            setCurrentConfig({ steps: DEFAULT_STEPS.map(s => ({ ...s, fields: [] })) });
        }
    }, []);

    useEffect(() => {
        if (forms.length > 0) {
            loadForm(activeFormSlug, forms);
        }
    }, [activeFormSlug, forms]);

    const handleSave = useCallback(async () => {
        if (!currentConfig) return;
        setIsSaving(true);
        try {
            const formInfo = FORM_TYPES.find(f => f.slug === activeFormSlug);
            const res = await fetch(`/api/forms/${activeFormSlug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    definition: currentConfig,
                    name: formInfo?.name || activeFormSlug
                })
            });
            if (!res.ok) throw new Error('Save failed');
            toast.success('Formulář úspěšně uložen');
            setForms(prev => {
                const existing = prev.find(f => f.slug === activeFormSlug);
                if (existing) {
                    return prev.map(f => f.slug === activeFormSlug ? { ...f, definition: currentConfig } : f);
                } else {
                    return [...prev, { id: 'temp', slug: activeFormSlug, name: formInfo?.name || activeFormSlug, description: '', definition: currentConfig }];
                }
            });
        } catch (err) {
            toast.error('Chyba při ukládání konfigurace');
        } finally {
            setIsSaving(false);
        }
    }, [activeFormSlug, currentConfig]);

    const addStep = useCallback(() => {
        if (!currentConfig) return;
        const newId = `step-${Date.now()}`;
        const newStep: Step = {
            id: newId,
            title: 'Nový krok',
            fields: []
        };
        setCurrentConfig({
            ...currentConfig,
            steps: [...currentConfig.steps, newStep]
        });
        setExpandedSteps(prev => ({ ...prev, [newId]: true }));
    }, [currentConfig]);

    const removeStep = useCallback((stepId: string) => {
        if (!currentConfig) return;
        if (!confirm('Opravdu smazat tento krok a všechna jeho pole?')) return;
        setCurrentConfig({
            ...currentConfig,
            steps: currentConfig.steps.filter(s => s.id !== stepId)
        });
    }, [currentConfig]);

    const toggleStep = useCallback((stepId: string) => {
        setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
    }, []);

    const addField = useCallback((stepId: string) => {
        if (!currentConfig) return;
        const newField: Field = {
            id: `field-${Date.now()}`,
            name: `pole_${Date.now()}`,
            label: 'Nové pole',
            type: 'text',
            required: false,
            order: 0,
            placeholder: ''
        };

        setCurrentConfig({
            ...currentConfig,
            steps: currentConfig.steps.map(step => {
                if (step.id === stepId) {
                    return { ...step, fields: [...step.fields, newField] };
                }
                return step;
            })
        });
    }, [currentConfig]);

    const updateField = useCallback((stepId: string, fieldId: string, updates: Partial<Field>) => {
        if (!currentConfig) return;
        setCurrentConfig({
            ...currentConfig,
            steps: currentConfig.steps.map(step => {
                if (step.id === stepId) {
                    return {
                        ...step,
                        fields: step.fields.map(field =>
                            field.id === fieldId ? { ...field, ...updates } : field
                        )
                    };
                }
                return step;
            })
        });
    }, [currentConfig]);

    const removeField = useCallback((stepId: string, fieldId: string) => {
        if (!currentConfig) return;
        setCurrentConfig({
            ...currentConfig,
            steps: currentConfig.steps.map(step => {
                if (step.id === stepId) {
                    return { ...step, fields: step.fields.filter(f => f.id !== fieldId) };
                }
                return step;
            })
        });
    }, [currentConfig]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || !currentConfig) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId !== overId) {
            // Check if we are dragging a STEP
            const isStepDrag = activeId.startsWith('step-') || currentConfig.steps.some(s => s.id === activeId);

            if (isStepDrag) {
                const oldIndex = currentConfig.steps.findIndex(s => s.id === activeId);
                const newIndex = currentConfig.steps.findIndex(s => s.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newSteps = arrayMove(currentConfig.steps, oldIndex, newIndex);
                    setCurrentConfig({ ...currentConfig, steps: newSteps });
                }
                return;
            }

            // Otherwise assume we are dragging FIELDS
            const sourceStepIndex = currentConfig.steps.findIndex(s => s.fields.some(f => f.id === activeId));
            const destStepIndex = currentConfig.steps.findIndex(s => s.fields.some(f => f.id === overId));

            // Move within SAME step
            if (sourceStepIndex === destStepIndex && sourceStepIndex !== -1) {
                const step = currentConfig.steps[sourceStepIndex];
                const oldIndex = step.fields.findIndex(f => f.id === activeId);
                const newIndex = step.fields.findIndex(f => f.id === overId);

                const newFields = arrayMove(step.fields, oldIndex, newIndex);

                const newSteps = [...currentConfig.steps];
                newSteps[sourceStepIndex] = { ...step, fields: newFields };

                setCurrentConfig({ ...currentConfig, steps: newSteps });
            }
        }
    };

    // New: Duplicate Step
    const duplicateStep = useCallback((stepId: string) => {
        if (!currentConfig) return;
        const step = currentConfig.steps.find(s => s.id === stepId);
        if (!step) return;

        const newId = `step-${Date.now()}`;
        const newStep: Step = {
            ...step,
            id: newId,
            title: `${step.title} (Kopie)`,
            fields: step.fields.map(f => ({ ...f, id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }))
        };

        setCurrentConfig({
            ...currentConfig,
            steps: [...currentConfig.steps, newStep]
        });
        setExpandedSteps(prev => ({ ...prev, [newId]: true }));
    }, [currentConfig]);

    // New: Duplicate Field
    const duplicateField = useCallback((stepId: string, fieldId: string) => {
        if (!currentConfig) return;
        setCurrentConfig({
            ...currentConfig,
            steps: currentConfig.steps.map(step => {
                if (step.id === stepId) {
                    const fieldIndex = step.fields.findIndex(f => f.id === fieldId);
                    if (fieldIndex === -1) return step;

                    const field = step.fields[fieldIndex];
                    const newField = {
                        ...field,
                        id: `field-${Date.now()}`,
                        label: `${field.label} (Kopie)`,
                        name: `${field.name}_copy`
                    };

                    const newFields = [...step.fields];
                    newFields.splice(fieldIndex + 1, 0, newField);

                    return { ...step, fields: newFields };
                }
                return step;
            })
        });
    }, [currentConfig]);

    const updateStepTitle = useCallback((stepIndex: number, title: string) => {
        if (!currentConfig) return;
        const newConfig = { ...currentConfig };
        newConfig.steps[stepIndex] = { ...newConfig.steps[stepIndex], title };
        setCurrentConfig(newConfig);
    }, [currentConfig]);

    const findActiveField = () => {
        if (!activeId || !currentConfig) return null;
        for (const step of currentConfig.steps) {
            const f = step.fields.find(field => field.id === activeId);
            if (f) return { field: f, stepId: step.id };
        }
        return null;
    };

    const activeItem = findActiveField();

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-500 font-medium animate-pulse">Načítání konfigurace editoru...</p>
        </div>
    );

    return (
        <AdminPageTemplate
            title="Formuláře & Vstupy"
            subtitle="System Configuration"
            category="Web & Android"
            icon="LayoutGrid"
            actions={
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-11 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl px-6 text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                    {isSaving ? <div className="w-4 h-4 border-2 border-current/20 border-t-current rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Uložit
                </Button>
            }
            search={
                <div className="relative">
                    <select
                        value={activeFormSlug}
                        onChange={(e) => setActiveFormSlug(e.target.value)}
                        className="w-full appearance-none bg-transparent border-none pl-4 pr-10 py-1.5 text-xs font-black focus:outline-none cursor-pointer text-zinc-900 dark:text-white"
                    >
                        {FORM_TYPES.map(f => (
                            <option key={f.slug} value={f.slug}>{f.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
            }
            sorting={
                <div className="flex bg-white dark:bg-zinc-800 p-0.5 rounded-xl shadow-sm">
                    <button
                        onClick={() => setViewMode('builder')}
                        className={cn(
                            "flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                            viewMode === 'builder' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Editor
                    </button>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={cn(
                            "flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black transition-all",
                            viewMode === 'preview' ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Náhled
                    </button>
                </div>
            }
        >
            {viewMode === 'preview' ? (
                <div className="bg-zinc-50 dark:bg-white/5 rounded-[3rem] p-12 border border-zinc-200 dark:border-white/10 min-h-[700px] flex items-center justify-center">
                    <div className="bg-white dark:bg-zinc-950 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] dark:shadow-none border border-zinc-200 dark:border-white/5 w-full max-w-xl">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Náhled formuláře</h2>
                            <div className="flex gap-2">
                                {currentConfig?.steps.map(step => (
                                    <button
                                        key={step.id}
                                        onClick={() => setPreviewStep(step.id)}
                                        className={cn(
                                            "w-2.5 h-2.5 rounded-full transition-all",
                                            previewStep === step.id ? "bg-blue-500 scale-125" : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {currentConfig && (
                            <FormRenderer
                                slug={activeFormSlug}
                                stepId={previewStep}
                                values={previewValues}
                                onChange={setPreviewValues}
                                directDefinition={currentConfig} // Direct definition injection
                                dark={true} // Preview in dark mode by default for premium feel
                                context={{
                                    // Mock context for widget previews
                                    route: { routeTitle: 'Testovací Trasa', extraPoints: { points: 12.5 } },
                                    photos: [],
                                    places: [],
                                }}
                            />
                        )}

                        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-white/5 flex justify-between text-xs text-zinc-400">
                            <span>Step ID: {previewStep}</span>
                            <span>Fields: {currentConfig?.steps.find(s => s.id === previewStep)?.fields.length || 0}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="space-y-4">
                        <SortableContext items={currentConfig?.steps.map(s => s.id) || []} strategy={verticalListSortingStrategy}>
                            <AnimatePresence>
                                {currentConfig?.steps.map((step, stepIndex) => (
                                    <SortableStep
                                        key={step.id}
                                        step={step}
                                        stepIndex={stepIndex}
                                        expanded={!!expandedSteps[step.id]}
                                        onToggle={toggleStep}
                                        onRemove={removeStep}
                                        onUpdateTitle={updateStepTitle}
                                        onDuplicate={duplicateStep}
                                        onAddField={addField}
                                        fields={step.fields}
                                        onUpdateField={updateField}
                                        onRemoveField={removeField}
                                        onDuplicateField={duplicateField}
                                    />
                                ))}
                            </AnimatePresence>
                        </SortableContext>

                        <Button
                            variant="outline"
                            onClick={addStep}
                            className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all rounded-[2.5rem] group"
                        >
                            <div className="flex flex-col items-center">
                                <Plus className="w-8 h-8 text-gray-300 group-hover:text-indigo-500 transition-colors mb-2" />
                                <span className="text-sm font-black text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 uppercase tracking-widest transition-colors">Vytvořit nový krok konfigurace</span>
                            </div>
                        </Button>
                    </div>

                    {typeof document !== 'undefined' && createPortal(
                        <DragOverlay dropAnimation={null}>
                            {activeItem ? (
                                <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-3 opacity-90 cursor-grabbing min-w-[300px] z-[9999]">
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="w-4 h-4 text-zinc-400" />
                                        <div className="text-xs font-bold text-zinc-900 dark:text-white">
                                            {'label' in activeItem.field ? activeItem.field.label : 'Položka'}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </DragOverlay>,
                        document.body
                    )}
                </DndContext>
            )}
        </AdminPageTemplate>
    );
}

// Sub-components moved outside for stability

interface SortableStepProps {
    step: Step;
    stepIndex: number;
    expanded: boolean;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onUpdateTitle: (index: number, title: string) => void;
    onDuplicate: (id: string) => void;
    onAddField: (id: string) => void;
    fields: Field[];
    onUpdateField: (stepId: string, fieldId: string, updates: Partial<Field>) => void;
    onRemoveField: (stepId: string, fieldId: string) => void;
    onDuplicateField: (stepId: string, fieldId: string) => void;
}

const SortableStep = memo(({
    step,
    stepIndex,
    expanded,
    onToggle,
    onRemove,
    onUpdateTitle,
    onDuplicate,
    onAddField,
    fields,
    onUpdateField,
    onRemoveField,
    onDuplicateField
}: SortableStepProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : 1
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(isDragging && "scale-[1.02] shadow-2xl")}
        >
            <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between py-6 px-8 bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-6">
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500">
                            <GripVertical className="w-6 h-6" />
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-white/10 shadow-sm text-blue-600 dark:text-blue-400 text-sm font-black border border-gray-100 dark:border-white/5">
                            {stepIndex + 1}
                        </div>
                        <div className="space-y-1">
                            <Input
                                value={step.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateTitle(stepIndex, e.target.value)}
                                placeholder="Název kroku"
                                className="bg-transparent border-none p-0 h-auto w-auto focus-visible:ring-0 font-black text-2xl tracking-tight text-gray-900 dark:text-white"
                            />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {fields.length} {fields.length === 1 ? 'pole' : fields.length >= 2 && fields.length <= 4 ? 'pole' : 'polí'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDuplicate(step.id)}
                            title="Duplikovat krok"
                            className="text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl h-10 px-3 transition-colors font-bold text-xs uppercase"
                        >
                            <Copy className="w-4 h-4 mr-2" /> Klonovat
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemove(step.id)}
                            className="text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl h-10 px-3 transition-colors font-bold text-xs uppercase"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Smazat
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggle(step.id)}
                            className="text-gray-400 h-10 w-10 p-0 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        >
                            <CardContent className="p-4 space-y-3 bg-zinc-50/30 dark:bg-zinc-900/30">
                                <SortableContext
                                    items={fields.map(f => f.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {fields.map((field) => (
                                            <SortableField
                                                key={field.id}
                                                field={field}
                                                stepId={step.id}
                                                onUpdate={onUpdateField}
                                                onRemove={onRemoveField}
                                                onDuplicate={onDuplicateField}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => onAddField(step.id)}
                                        className="h-14 w-full border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all rounded-[1.5rem] font-black text-sm uppercase tracking-widest gap-2 active:scale-[0.98]"
                                    >
                                        <Plus className="w-5 h-5" /> Přidat vstupní pole
                                    </Button>
                                </div>
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
});

SortableStep.displayName = 'SortableStep';

interface SortableFieldProps {
    field: Field;
    stepId: string;
    onUpdate: (stepId: string, fieldId: string, updates: Partial<Field>) => void;
    onRemove: (stepId: string, fieldId: string) => void;
    onDuplicate: (stepId: string, fieldId: string) => void;
}

const SortableField = memo(({ field, stepId, onUpdate, onRemove, onDuplicate }: SortableFieldProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: field.id });

    const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
    };

    const typeConfig = FIELD_TYPES.find(t => t.type === field.type) || FIELD_TYPES[0];
    const FieldIcon = typeConfig.icon;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 transition-all",
                isDragging ? "border-zinc-900 dark:border-white shadow-xl scale-[0.98]" : "hover:border-zinc-300 dark:hover:border-zinc-700"
            )}
        >
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1">
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4 px-1">
                        <Input
                            value={field.label}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(stepId, field.id, { label: e.target.value })}
                            placeholder="Zobrazit jako..."
                            className="h-8 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 text-xs font-bold rounded-lg px-2"
                        />
                    </div>

                    <div className="col-span-3">
                        <div className="relative">
                            <select
                                value={field.type}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(stepId, field.id, { type: e.target.value as FieldType })}
                                className="w-full appearance-none h-8 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] pl-7 pr-6 font-black focus:outline-none cursor-pointer"
                            >
                                {FIELD_TYPES.map(t => (
                                    <option key={t.type} value={t.type}>{t.label}</option>
                                ))}
                            </select>
                            <FieldIcon className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors", typeConfig.color.split(' ')[0])} />
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <Input
                            value={field.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(stepId, field.id, { name: e.target.value })}
                            placeholder="database_key"
                            className="h-8 bg-zinc-100/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-700 text-[9px] font-mono rounded-lg px-2 opacity-60 hover:opacity-100 transition-opacity"
                        />
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-3">
                        <button
                            onClick={() => onUpdate(stepId, field.id, { required: !field.required })}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all scale-90",
                                field.required
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                                    : "bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                            )}
                        >
                            <span className="text-[10px] font-black uppercase tracking-tighter">REQ</span>
                            <div className={cn(
                                "w-3.5 h-3.5 rounded-full border-2 transition-all",
                                field.required ? "bg-blue-500 border-blue-600" : "bg-transparent border-zinc-300 dark:border-zinc-700"
                            )} />
                        </button>

                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                                className={cn("h-7 w-7 p-0 rounded-lg", isAdvancedExpanded ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm" : "text-zinc-400")}
                                title="Pokročilé nastavení"
                            >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDuplicate(stepId, field.id)}
                                className="h-7 w-7 p-0 text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"
                                title="Duplikovat"
                            >
                                <Copy className="w-3.5 h-3.5" />
                            </Button>

                            {field.type === 'select' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                                    className={cn("h-7 w-7 p-0 rounded-lg", isOptionsExpanded ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm" : "text-zinc-400")}
                                >
                                    <List className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemove(stepId, field.id)}
                                className="h-7 w-7 p-0 text-zinc-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {field.type === 'select' && isOptionsExpanded && (
                <div className="mt-2 ml-10 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Konfigurace možností</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const options = field.options || [];
                                onUpdate(stepId, field.id, {
                                    options: [...options, { label: 'Možnost', value: `val_${Date.now()}` }]
                                });
                            }}
                            className="h-6 text-[9px] font-black text-blue-500 hover:text-blue-600 uppercase rounded-md"
                        >
                            + Přidat možnost
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {field.options?.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-1 group/opt">
                                <Input
                                    value={opt.label}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newOpts = [...(field.options || [])];
                                        newOpts[optIndex].label = e.target.value;
                                        newOpts[optIndex].value = e.target.value.toLowerCase().trim().replace(/\s+/g, '_');
                                        onUpdate(stepId, field.id, { options: newOpts });
                                    }}
                                    placeholder="Popisek volby"
                                    className="h-7 text-[10px] px-2 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-medium"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const newOpts = field.options?.filter((_, i) => i !== optIndex);
                                        onUpdate(stepId, field.id, { options: newOpts });
                                    }}
                                    className="h-7 w-7 p-0 text-zinc-300 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-2.5 h-2.5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isAdvancedExpanded && (
                <div className="mt-2 ml-10 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Pokročilé nastavení</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-zinc-400 pl-1">Placeholder</label>
                            <Input
                                value={field.placeholder || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(stepId, field.id, { placeholder: e.target.value })}
                                placeholder="Např. Zadejte vaše jméno..."
                                className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-zinc-400 pl-1">Vysvětlivka (pod polem)</label>
                            <Input
                                value={field.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(stepId, field.id, { description: e.target.value })}
                                placeholder="Nápověda pro uživatele..."
                                className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

SortableField.displayName = 'SortableField';
