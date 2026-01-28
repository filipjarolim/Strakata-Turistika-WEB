'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trophy, Calendar, TrendingUp, Route, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import CompetitionBackground from '@/components/ui/competition/CompetitionBackground';

interface Visit {
    id: string;
    routeTitle?: string | null;
    visitedPlaces?: string | null;
    points: number;
    visitDate: unknown;
    extraPoints?: unknown;
    isFreeCategory?: boolean;
    strataCategoryId?: string | null;
}

export interface UserData {
    id: string;
    name: string | null;
    image: string | null;
    visits: Visit[];
}

interface CreatedRoute {
    id: string;
    title: string;
    creatorBonusPoints: number;
    _count: { visits: number } | null;
}

interface UserStatsClientProps {
    user: UserData;
    year: number;
    className?: string;
    loggedInUserId?: string;
    createdRoutes: CreatedRoute[];
}

export function UserStatsClient({ user, year, className, loggedInUserId, createdRoutes }: UserStatsClientProps) {
    // Calculate Stats
    const totalPoints = user.visits.reduce((acc, v) => acc + v.points, 0);
    const totalVisits = user.visits.length;

    // Calculate distance (if stored in extraPoints)
    const totalDistance = user.visits.reduce((acc, v) => {
        const extra = v.extraPoints as Record<string, number> | undefined;
        const dist = extra?.distance || 0;
        return acc + dist;
    }, 0);

    const uniqueDays = new Set(user.visits.map(v => new Date(v.visitDate as string).toDateString())).size;

    const freeCategoryUsed = user.visits.some(v => v.isFreeCategory);

    // Creator stats
    const totalCreatorBonus = createdRoutes.reduce((acc, r) => acc + (r.creatorBonusPoints || 0), 0);
    const totalRouteCompletions = createdRoutes.reduce((acc, r) => acc + (r._count?.visits || 0), 0);

    return (
        <div className="min-h-screen text-white relative">
            <CompetitionBackground />

            <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-16">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 overflow-hidden bg-white/5">
                        {user.image ? (
                            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/20">
                                {user.name?.[0] || '?'}
                            </div>
                        )}
                    </div>

                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-3">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Sezóna {year}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic mb-2">
                            {user.name}
                        </h1>
                        <p className="text-white/40 uppercase tracking-widest text-sm">
                            Detailní statistiky soutěžícího
                        </p>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    {[
                        { label: 'Celkem bodů', value: totalPoints, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
                        { label: 'Navštívených míst', value: totalVisits, icon: MapPin, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                        { label: 'Naplánováno', value: `${Math.round(totalDistance)} km`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
                        { label: 'Aktivních dní', value: uniqueDays, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' }
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            className={cn("p-6 rounded-2xl border backdrop-blur-sm", stat.bg, stat.border)}
                            whileHover={{ y: -5 }}
                        >
                            <stat.icon className={cn("w-6 h-6 mb-4", stat.color)} />
                            <p className="text-3xl font-black">{stat.value}</p>
                            <p className="text-xs uppercase tracking-widest opacity-60 mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Creator Stats */}
                {createdRoutes.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 flex items-center gap-3">
                            <Route className="w-6 h-6 text-amber-500" />
                            Tvůrce tras
                        </h2>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-8 rounded-3xl">
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-500/60 mb-2">Vytvořené trasy</p>
                                        <p className="text-4xl font-black text-white">{createdRoutes.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-500/60 mb-2">Bonusové body</p>
                                        <p className="text-4xl font-black text-amber-400">+{totalCreatorBonus}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Seznam tras</h3>
                                <div className="space-y-3">
                                    {createdRoutes.map(route => (
                                        <div key={route.id} className="flex justify-between items-center text-sm">
                                            <span className="font-bold truncate max-w-[150px]">{route.title}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/60">
                                                    {/* Approximation if _count is not available */}
                                                    {route._count?.visits ?? 0}× splněno
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Activity / Visits Log */}
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 flex items-center gap-3">
                        <Award className="w-6 h-6 text-white" />
                        Historie výprav
                    </h2>

                    <div className="space-y-4">
                        {user.visits.sort((a, b) => new Date(b.visitDate as string).getTime() - new Date(a.visitDate as string).getTime()).map((visit) => (
                            <div key={visit.id} className="group p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="font-bold text-lg">{visit.routeTitle}</p>
                                        {visit.isFreeCategory && (
                                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                                                Volná
                                            </span>
                                        )}
                                        {visit.strataCategoryId && (
                                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30">
                                                Strakatá
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-white/40 font-medium uppercase tracking-wider">
                                        <span>{new Date(visit.visitDate as string).toLocaleDateString('cs-CZ')}</span>
                                        {((visit.extraPoints as Record<string, number> | undefined)?.distance) && (
                                            <span>• {Math.round((visit.extraPoints as Record<string, number>).distance)} km</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white">+{visit.points}</p>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Bodů</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {user.visits.length === 0 && (
                            <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                                <p className="text-white/40">Zatím žádné výpravy</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
