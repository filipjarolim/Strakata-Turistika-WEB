'use client';

import { useState, useEffect } from 'react';
import { MapPin, Info, Sparkles, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { IOSTextInput, IOSTextarea } from '@/components/ui/ios';
import { cn } from '@/lib/utils';
import CompetitionBackground from '@/components/ui/competition/CompetitionBackground';

interface Category {
    id: string;
    name: string;
    label: string;
    icon: string;
    order: number;
    available: boolean; // Can use this month
    isFirstThisMonth: boolean; // Bonus eligible
}

export function StrataTraasaClient({ userId }: { userId?: string }) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [routeName, setRouteName] = useState('');
    const [routeDescription, setRouteDescription] = useState('');
    const [createdThisMonth, setCreatedThisMonth] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            // If no user, we can't really check correctly, but show categories as available
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const [monthlyCheckRes, categoriesRes] = await Promise.all([
                    fetch(`/api/custom-routes/monthly-check?userId=${userId}`),
                    fetch(`/api/strata-categories/availability?userId=${userId}`)
                ]);

                const monthlyCheck = await monthlyCheckRes.json();
                const categoriesData = await categoriesRes.json();

                setCreatedThisMonth(monthlyCheck.hasCreatedThisMonth);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [userId]);

    const handleNext = () => {
        sessionStorage.setItem('strataRoute', JSON.stringify({
            categoryId: selectedCategory,
            name: routeName,
            description: routeDescription,
            userId
        }));

        window.location.href = '/soutez?type=strata-route';
    };

    const selectedCat = categories.find(c => c.id === selectedCategory);
    const availableCategories = categories.filter(c => c.available);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <CompetitionBackground />
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full relative z-10" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen text-white">
            <CompetitionBackground />

            <div className="max-w-5xl mx-auto px-6 pt-24 pb-32 relative z-10">
                {/* Header */}
                <div className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic"
                    >
                        Strakatá <span className="text-white/30">Trasa.</span>
                    </motion.h1>
                    <p className="text-white/40 text-xs uppercase tracking-widest mt-3">
                        Vytvořte trasu splňující konkrétní kategorii
                    </p>
                </div>

                {/* Monthly Limit Warning */}
                {createdThisMonth && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl mb-10"
                    >
                        <div className="flex items-start gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-2">
                                    Měsíční limit dosažen
                                </h3>
                                <p className="text-xs text-white/50 uppercase tracking-wider leading-relaxed">
                                    Tento měsíc jste již vytvořili trasu.<br />
                                    Další můžete vytvořit od <strong>1. dne příštího měsíce</strong>.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {!createdThisMonth && (
                    <div className="space-y-10">
                        {/* Info Cards */}
                        <div className="grid md:grid-cols-3 gap-5">
                            {[
                                { label: 'Min. délka', value: '7 km', icon: MapPin, color: 'blue' },
                                { label: 'Za vytvoření', value: '+2 body', icon: Sparkles, color: 'amber' },
                                { label: 'Použití kategorie', value: '1× měsíčně', icon: Info, color: 'purple' }
                            ].map((item) => (
                                <motion.div
                                    key={item.label}
                                    whileHover={{ y: -2 }}
                                    className="p-5 bg-white/5 border border-white/10 rounded-2xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            `bg-${item.color}-500/10 border border-${item.color}-500/20`
                                        )}>
                                            <item.icon className={cn("w-5 h-5", `text-${item.color}-400`)} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                                                {item.label}
                                            </p>
                                            <p className="text-lg font-black text-white mt-0.5">{item.value}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Main Form */}
                        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-10">
                            {/* Category Grid */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Vyberte kategorii (dostupné tento měsíc)
                                </label>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categories.map(cat => (
                                        <motion.button
                                            key={cat.id}
                                            whileHover={cat.available ? { scale: 1.03 } : {}}
                                            whileTap={cat.available ? { scale: 0.97 } : {}}
                                            onClick={() => cat.available && setSelectedCategory(cat.id)}
                                            disabled={!cat.available}
                                            className={cn(
                                                "p-5 rounded-2xl border transition-all text-left relative overflow-hidden",
                                                selectedCategory === cat.id
                                                    ? "bg-white text-black border-white shadow-lg shadow-white/20"
                                                    : !cat.available
                                                        ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed"
                                                        : "bg-white/10 border-white/10 text-white hover:bg-white/15 hover:border-white/20"
                                            )}
                                        >
                                            {cat.isFirstThisMonth && cat.available && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center">
                                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <p className="font-black text-sm uppercase tracking-wide">{cat.label}</p>
                                                <p className={cn(
                                                    "text-[8px] uppercase tracking-widest font-bold",
                                                    selectedCategory === cat.id ? "text-black/60" : "text-white/40"
                                                )}>
                                                    {!cat.available
                                                        ? 'Využito tento měsíc'
                                                        : cat.isFirstThisMonth
                                                            ? '+1 bonus • první tento měsíc'
                                                            : 'Dostupné'
                                                    }
                                                </p>
                                            </div>

                                            {selectedCategory === cat.id && (
                                                <div className="absolute bottom-2 right-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>

                                {availableCategories.length === 0 && (
                                    <div className="mt-6 p-5 bg-white/5 border border-white/10 rounded-2xl text-center">
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Všechny kategorie byly využity tento měsíc
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Route Details Form */}
                            {selectedCategory && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6 pt-8 border-t border-white/10"
                                >
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 block">
                                            Název trasy *
                                        </label>
                                        <IOSTextInput
                                            value={routeName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRouteName(e.target.value)}
                                            placeholder="NAPŘ. VODOPÁDOVÁ VÝPRAVA"
                                            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-bold uppercase text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-white/40 mb-3 block">
                                            Stručný popis (volitelné)
                                        </label>
                                        <IOSTextarea
                                            value={routeDescription}
                                            onChange={(val: string) => setRouteDescription(val)}
                                            placeholder="POPIŠTE SVOU TRASU, ZAJÍMAVOSTI PO CESTĚ..."
                                            colors={{
                                                background: 'bg-white/5',
                                                border: 'border-white/10',
                                                text: 'text-white font-bold uppercase text-xs',
                                                placeholder: 'text-white/20'
                                            }}
                                        />
                                    </div>

                                    {/* Bonus Indicator */}
                                    {selectedCat?.isFirstThisMonth && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Sparkles className="w-5 h-5 text-green-400" />
                                                <p className="text-xs font-bold text-green-400 uppercase tracking-wide">
                                                    První použití této kategorie tento měsíc! +1 bonusový bod
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Submit Button */}
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleNext}
                                        disabled={!routeName || routeName.length < 3}
                                        className={cn(
                                            "w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest italic text-sm transition-all mt-8",
                                            routeName && routeName.length >= 3
                                                ? "bg-white text-black hover:bg-slate-200 shadow-xl shadow-white/10"
                                                : "bg-white/5 text-white/10 cursor-not-allowed"
                                        )}
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                        Pokračovat k nakreslení trasy
                                    </motion.button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
