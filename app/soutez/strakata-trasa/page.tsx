'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    MapPin, AlertCircle, CheckCircle2, Info, ArrowLeft,
    Camera, Send, Trophy, Star, Sparkles, Loader2
} from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { EnhancedImageUpload } from '@/components/ui/ios/enhanced-image-upload';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSCard } from '@/components/ui/ios/card';
import { cn } from '@/lib/utils';

import CompetitionBackground from '@/components/ui/competition/CompetitionBackground';

interface Category {
    id: string;
    name: string;
    icon?: string;
    isFirstThisMonth?: boolean;
}

export default function StrakataTrasaPage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<{ url: string; public_id: string; title?: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/strakata-categories');
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Failed to fetch categories', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleImageUpload = async (file: File, title: string) => {
        const fd = new FormData(); fd.append("file", file); fd.append("title", title);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const d = await res.json();
        setImages(p => [...p, { url: d.url, public_id: d.public_id, title: d.title }]);
    };

    const handleSave = async () => {
        if (!selectedCategory) { setError('Prosím vyberte kategorii'); return; }
        if (!title) { setError('Prosím zadejte název místa'); return; }
        if (images.length === 0) { setError('Prosím nahrajte alespoň jednu fotografii'); return; }

        setIsSubmitting(true);
        setError(null);

        try {
            const seasonResponse = await fetch('/api/seasons');
            const seasons = await seasonResponse.json();
            const activeSeason = seasons.find((s: { isActive: boolean }) => s.isActive) || seasons[0];

            const response = await fetch('/api/visitData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routeTitle: `${selectedCategory.name}: ${title}`,
                    routeDescription: description,
                    visitDate: new Date(),
                    activityType: 'WALKING',
                    userId: session?.user?.id,
                    seasonId: activeSeason?.id,
                    year: activeSeason?.year || new Date().getFullYear(),
                    state: 'APPROVED',
                    photos: images,
                    strataCategoryId: selectedCategory.id,
                    strataCategoryIcon: selectedCategory.icon,
                    places: [{
                        id: 'strata',
                        name: title,
                        type: 'OTHER',
                        proofType: 'STANDARD',
                        description: description,
                        photos: images
                    }],
                    extraPoints: {
                        source: 'screenshot',
                        distance: 0,
                        points: 0 // Base points, API will add category points
                    }
                }),
            });

            if (!response.ok) {
                const d = await response.json();
                throw new Error(d.message || 'Nepodařilo se odeslat záznam');
            }

            setSuccess(true);
            setTimeout(() => router.push('/soutez'), 3000);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Chyba při odesílání');
            } else {
                setError('Chyba při odesílání');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <CompetitionBackground />
                <Loader2 className="animate-spin h-10 w-10 text-white/20" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen text-white">
            <CompetitionBackground />

            <div className="max-w-6xl mx-auto px-6 pt-24 pb-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.back()}
                            className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Soutěž</span>
                        </motion.button>

                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
                                Strakatá <span className="text-white/30">Trasa.</span>
                            </h1>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">20 výzev pro legendární sběratele</p>
                        </div>
                    </div>
                </div>

                {success ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-16 text-center space-y-6 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl"
                    >
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">ZAZNAMENÁNO.</h2>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-loose">Váš úspěch byl zapsán do strakaté historie.<br />Přesměrovávám vás zpět...</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Sidebar: Category Selection */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/40 mb-2">
                                <Trophy className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Vyberte kategorii</span>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 max-h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
                                {categories.map((cat) => {
                                    const isSelected = selectedCategory?.id === cat.id;
                                    return (
                                        <motion.button
                                            key={cat.id}
                                            whileHover={{ x: isSelected ? 0 : 5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setError(null);
                                            }}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group",
                                                isSelected
                                                    ? "bg-white/10 border-white/30 shadow-2xl"
                                                    : "bg-white/5 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                    isSelected ? "bg-white text-black" : "bg-white/5 group-hover:bg-white/10"
                                                )}>
                                                    <Sparkles className={cn("w-5 h-5", isSelected ? "text-black" : "text-white/30")} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm font-bold uppercase tracking-tight", isSelected ? "text-white" : "text-white/50")}>{cat.name}</p>
                                                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">Měsíční výzva</p>
                                                </div>
                                            </div>
                                            {cat.isFirstThisMonth && (
                                                <div className="absolute top-2 right-2">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Area: Form */}
                        <div className="lg:col-span-8">
                            <AnimatePresence mode="wait">
                                {selectedCategory ? (
                                    <motion.div
                                        key={selectedCategory.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                        className="space-y-8"
                                    >
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Info className="w-4 h-4 text-white/40" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">PRAVIDLA KATEGORIE</span>
                                            </div>
                                            <div className="grid sm:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'FREKVENCE', value: '1× MĚSÍČNĚ' },
                                                    { label: 'ZÁKLAD', value: '1 BOD' },
                                                    { label: 'BONUS', value: '+1 ZA PRVENSTVÍ' }
                                                ].map((stat, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{stat.label}</p>
                                                        <p className="text-xs font-black text-white uppercase italic">{stat.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-10">
                                            <div className="space-y-8">
                                                <IOSTextInput
                                                    label="Místo"
                                                    placeholder="NAPŘ. ROZHLEDNA X"
                                                    value={title}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                                    className="bg-white/5 border-white/10 focus:border-white/30 text-white placeholder:text-white/10 font-bold uppercase tracking-widest text-xs"
                                                />

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">
                                                        Detaily
                                                    </label>
                                                    <IOSTextarea
                                                        placeholder="CO VÁS NA MÍSTĚ ZAUJALO?"
                                                        value={description}
                                                        onChange={setDescription}
                                                        colors={{
                                                            background: 'bg-white/5',
                                                            text: 'text-white font-bold text-xs uppercase tracking-widest leading-relaxed',
                                                            placeholder: 'text-white/10',
                                                            border: 'border-white/10',
                                                            focus: 'border-white/30'
                                                        }}
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 flex items-center gap-2">
                                                        <Camera className="w-3.5 h-3.5" />
                                                        Fotodokumentace
                                                    </label>
                                                    <div className="p-2 bg-white/5 rounded-3xl border border-white/5">
                                                        <EnhancedImageUpload
                                                            sources={images}
                                                            onUpload={handleImageUpload}
                                                            onDelete={async (id) => setImages(p => p.filter(i => i.public_id !== id))}
                                                            aspectRatio="landscape"
                                                            count={3}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {error && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center italic"
                                                >
                                                    {error}
                                                </motion.div>
                                            )}

                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSave}
                                                disabled={isSubmitting || !title}
                                                className={cn(
                                                    "w-full h-16 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase tracking-[0.2em] italic text-sm",
                                                    isSubmitting || !title
                                                        ? "bg-white/5 text-white/10 cursor-not-allowed"
                                                        : "bg-white text-black hover:bg-slate-200 shadow-xl shadow-white/5"
                                                )}
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Zaznamenat do tras</>}
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-white/10 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/2 space-y-4">
                                        <Trophy className="w-16 h-16 opacity-10" />
                                        <div className="text-center space-y-1">
                                            <p className="text-xs font-black uppercase tracking-[0.3em]">VYBERTE VÝZVU</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 italic">POKRAČUJTE VOLBOU KATEGORIE VLEVO</p>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
