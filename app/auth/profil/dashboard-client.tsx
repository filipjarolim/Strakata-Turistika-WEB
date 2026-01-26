"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { VisitDataWithUser } from '@/lib/results-utils';
import { VisitDetailSheet } from '@/components/results/VisitDetailSheet';
import { VisitCard } from '@/components/results/VisitCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2,
    Search,
    CheckCircle2,
    Clock,
    XCircle,
    FileEdit,
    LayoutGrid
} from 'lucide-react';
import { cn } from "@/lib/utils";

// IOS-style Segmented Control for tabs
const TabButton = ({ active, children, onClick, icon: Icon, count }: { active: boolean, children: React.ReactNode, onClick: () => void, icon?: any, count?: number }) => (
    <button
        onClick={onClick}
        className={cn(
            "relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
            active
                ? "text-black dark:text-white bg-white dark:bg-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
        )}
    >
        {Icon && <Icon className={cn("w-4 h-4", active ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />}
        <span>{children}</span>
        {count !== undefined && (
            <span className={cn(
                "ml-1 text-[10px] px-1.5 py-0.5 rounded-md min-w-[20px] text-center font-bold",
                active
                    ? "bg-gray-100 dark:bg-white/20 text-gray-900 dark:text-white"
                    : "bg-gray-100 dark:bg-white/5 text-gray-500"
            )}>
                {count}
            </span>
        )}
        {active && (
            <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 rounded-xl bg-white dark:bg-white/10 -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
    </button>
);

// Glass Button reused from other parts
const GlassButton = ({ active, children, onClick, className }: { active?: boolean, children: React.ReactNode, onClick: () => void, className?: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border",
            active
                ? "bg-blue-600 text-white border-blue-500 shadow-md transform scale-105"
                : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10",
            className
        )}
    >
        {children}
    </button>
);

type VisitState = 'ALL' | 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'DRAFT';

export default function DashboardClient({ user }: { user: any }) {
    // State
    const [allYears, setAllYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [visits, setVisits] = useState<VisitDataWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter State
    const [activeTab, setActiveTab] = useState<VisitState>('ALL');

    // Modal State
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<VisitDataWithUser | null>(null);

    // Fetch Years
    useEffect(() => {
        fetch('/api/seasons')
            .then(res => res.json())
            .then(data => {
                const sorted = [...data].sort((a: number, b: number) => b - a);
                setAllYears(sorted);
                if (sorted.length > 0 && !sorted.includes(selectedYear)) {
                    setSelectedYear(sorted[0]); // Default to newest if current not found
                }
            })
            .catch(err => console.error("Error fetching seasons:", err));
    }, []);

    // Fetch Visits
    useEffect(() => {
        if (!user?.id) return;

        setIsLoading(true);
        // Fetch logic: Pass state to API. If 'ALL', API returns everything.
        const queryState = activeTab;

        fetch(`/api/results/visits/${selectedYear}?userId=${user.id}&limit=200&state=${queryState}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch visits');
                return res.json();
            })
            .then(resData => {
                setVisits(resData.data || []);
            })
            .catch(err => {
                console.error("Error fetching visits:", err);
            })
            .finally(() => setIsLoading(false));
    }, [selectedYear, user?.id, activeTab]);

    // Derived Stats
    const totalPoints = visits
        .filter(v => v.state === 'APPROVED')
        .reduce((sum, item) => sum + (item.points || 0), 0);

    const visitCounts = {
        ALL: visits.length, // Only valid if fetching ALL, but we fetch per tab now. 
        // Actually, to show counts on tabs we ideally need all data or separate counts stats. 
        // For now, only showing count for the CURRENT active tab is accurate if we fetch per tab.
        // If we want counts on all tabs, we'd need to fetch ALL and filter client side.
        // Let's try client-side filtering approach for better UX (instant switching) if dataset isn't huge.
        // BUT previously I set up API to filter.
        // Let's stick to API filtering for scale, and maybe omit counts on inactive tabs for now to keep it simple and performant.
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Controls & Stats Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Controls Card */}
                <div className="lg:col-span-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">

                        {/* Years */}
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {allYears.map(y => (
                                <GlassButton
                                    key={y}
                                    active={selectedYear === y}
                                    onClick={() => setSelectedYear(y)}
                                >
                                    {y}
                                </GlassButton>
                            ))}
                        </div>

                        {/* Summary Big Numbers */}
                        <div className="flex items-center gap-8 pl-0 md:pl-8 md:border-l border-gray-200 dark:border-white/10">
                            <div className="text-center md:text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Celkem bodů</div>
                                <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalPoints}</div>
                                <div className="text-[10px] text-gray-400">v roce {selectedYear}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Filter */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start bg-gray-100/50 dark:bg-black/20 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0">
                            <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} icon={LayoutGrid}>
                                Vše
                            </TabButton>
                            <TabButton active={activeTab === 'APPROVED'} onClick={() => setActiveTab('APPROVED')} icon={CheckCircle2}>
                                Schválené
                            </TabButton>
                            <TabButton active={activeTab === 'PENDING_REVIEW'} onClick={() => setActiveTab('PENDING_REVIEW')} icon={Clock}>
                                Čeká na kontrolu
                            </TabButton>
                            <TabButton active={activeTab === 'REJECTED'} onClick={() => setActiveTab('REJECTED')} icon={XCircle}>
                                Zamítnuté
                            </TabButton>
                            <TabButton active={activeTab === 'DRAFT'} onClick={() => setActiveTab('DRAFT')} icon={FileEdit}>
                                Drafty
                            </TabButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                    <p className="animate-pulse">Načítám vaše cesty...</p>
                </div>
            ) : (
                <div className="min-h-[400px]">
                    <AnimatePresence mode="popLayout">
                        {visits.length > 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {visits.map(visit => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        onClick={() => { setSelectedVisit(visit); setSheetOpen(true); }}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-20 px-4"
                            >
                                <div className="bg-gray-50 dark:bg-white/5 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 ring-4 ring-white dark:ring-white/5 shadow-xl">
                                    <Search className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Žádné záznamy</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                    V této kategorii zatím nemáte žádné cesty. Zkuste změnit rok nebo filtr.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Detail Sheet */}
            <VisitDetailSheet
                visit={selectedVisit}
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
            />
        </div>
    );
}
