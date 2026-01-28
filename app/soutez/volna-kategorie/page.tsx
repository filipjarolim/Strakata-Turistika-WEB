'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MapPin, AlertCircle, CheckCircle2, Info, ArrowLeft, Camera, Send, Loader2, Sparkles, Star } from 'lucide-react';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSTextarea } from '@/components/ui/ios/textarea';
import { EnhancedImageUpload } from '@/components/ui/ios/enhanced-image-upload';
import { motion, AnimatePresence } from 'framer-motion';
import { IOSFormField } from '@/components/ui/ios/form-field';
import { IOSLabel } from '@/components/ui/ios/label';
import CompetitionBackground from '@/components/ui/competition/CompetitionBackground';
import { cn } from '@/lib/utils';

export default function VolnaKategoriePage() {
    const { data: session } = useSession();
    const router = useRouter();

    const [status, setStatus] = useState<{ available: boolean; week?: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<{ url: string; public_id: string; title?: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkAvailability = async () => {
            if (!session?.user?.id) return;
            try {
                const res = await fetch('/api/visitData/free-availability');
                const data = await res.json();
                setStatus(data);
            } catch (err) {
                console.error('Failed to check availability', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkAvailability();
    }, [session]);

    const handleImageUpload = async (file: File, title: string) => {
        const fd = new FormData(); fd.append("file", file); fd.append("title", title);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const d = await res.json();
        setImages(p => [...p, { url: d.url, public_id: d.public_id, title: d.title }]);
    };

    const handleSave = async () => {
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
                    routeTitle: `VOLNÁ: ${title}`,
                    routeDescription: description,
                    visitDate: new Date(),
                    activityType: 'WALKING',
                    userId: session?.user?.id,
                    seasonId: activeSeason?.id,
                    year: activeSeason?.year || new Date().getFullYear(),
                    state: 'PENDING_REVIEW', // Free categories always go to review
                    photos: images,
                    isFreeCategory: true,
                    freeCategoryIcon: 'Star',
                    // Special free category data
                    places: [{
                        id: 'free',
                        name: title,
                        type: 'OTHER',
                        proofType: 'VOLNÁ',
                        description: description,
                        photos: images
                    }],
                    extraPoints: {
                        source: 'screenshot',
                        distance: 0,
                        points: 1 // Fixed 1 point for Volná
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <CompetitionBackground />
                <Loader2 className="animate-spin h-10 w-10 text-slate-400 dark:text-white/20" />
            </div>
        );
    }

    if (status && !status.available) {
        return (
            <div className="relative min-h-screen text-slate-900 dark:text-white flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                <CompetitionBackground />
                <div className="max-w-xl w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 text-center space-y-8 bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl"
                    >
                        <div className="w-20 h-20 bg-amber-500/10 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 dark:border-amber-500/30">
                            <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">LIMIT VYČERPÁN.</h1>
                            <p className="text-slate-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest leading-loose">
                                Pro tento týden (TÝDEN {status.week}) jste již svou volnou kategorii využili.<br />
                                Další záznam budete moci přidat v pondělí příštího týdne.
                            </p>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => router.push('/soutez')}
                            className="bg-slate-900 dark:bg-white text-white dark:text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest italic text-xs hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                        >
                            Zpět do soutěže
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950">
            <CompetitionBackground />

            <div className="max-w-4xl mx-auto px-6 pt-24 pb-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.back()}
                            className="flex items-center gap-3 text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:bg-white/90 dark:group-hover:bg-white/10">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Soutěž</span>
                        </motion.button>

                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                                Volná <span className="text-slate-300 dark:text-white/30">Kategorie.</span>
                            </h1>
                            <p className="text-slate-400 dark:text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Bod za jakékoliv místo, jednou týdně</p>
                        </div>
                    </div>
                </div>

                {success ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-16 text-center space-y-6 bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl"
                    >
                        <div className="w-20 h-20 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/20 dark:border-green-500/30">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">ODESLÁNO.</h2>
                            <p className="text-slate-500 dark:text-white/40 text-[10px] font-bold uppercase tracking-widest leading-loose">Váš záznam byl odeslán ke schválení.<br />Přesměrovávám vás zpět...</p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        <div className="p-6 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl space-y-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <Info className="w-4 h-4 text-slate-400 dark:text-white/40" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60">INFORMACE</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest leading-relaxed">
                                U volné kategorie se nekontroluje vzdálenost od turistické trasy ani typ místa.
                                Stačí nahrát fotku místa, které vás zaujalo. Za tento záznam získáte 1 bod.
                            </p>
                        </div>

                        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-10">
                            <div className="space-y-8">
                                <IOSFormField label="Název místa" dark>
                                    <IOSTextInput
                                        placeholder="NAPŘ. TAJNÝ LESNÍ RYBNÍK"
                                        value={title}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                        className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:border-slate-400 dark:focus:border-white/30 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/10 font-bold uppercase tracking-widest text-xs"
                                        dark
                                    />
                                </IOSFormField>

                                <div className="space-y-1">
                                    <IOSFormField label="Krátký popis" dark>
                                        <IOSTextarea
                                            placeholder="NAPIŠTE NÁM NĚCO O TOMTO MÍSTĚ..."
                                            value={description}
                                            onChange={setDescription}
                                            colors={{
                                                background: 'bg-white/50 dark:bg-white/5',
                                                text: 'text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest leading-relaxed',
                                                placeholder: 'text-slate-400 dark:text-white/10',
                                                border: 'border-slate-200 dark:border-white/10',
                                                focus: 'border-slate-400 dark:border-white/30'
                                            }}
                                        />
                                    </IOSFormField>
                                </div>

                                <div className="space-y-1">
                                    <IOSFormField label="Fotodokumentace" labelIcon={<Camera className="w-3.5 h-3.5" />} dark>
                                        <div className="p-2 bg-white/50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5">
                                            <EnhancedImageUpload
                                                sources={images}
                                                onUpload={handleImageUpload}
                                                onDelete={async (id) => setImages(p => p.filter(i => i.public_id !== id))}
                                                aspectRatio="landscape"
                                                count={3}
                                            />
                                        </div>
                                    </IOSFormField>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center italic"
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
                                        ? "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/10 cursor-not-allowed"
                                        : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 shadow-xl shadow-slate-900/5 dark:shadow-white/5"
                                )}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Odeslat záznam</>}
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
