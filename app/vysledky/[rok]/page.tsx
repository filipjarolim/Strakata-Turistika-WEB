"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Share2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import ResultsClient from './results-client';

export default function SeasonResultsPage({ params }: { params: Promise<{ rok: string }> }) {
    const { rok } = use(params);
    const year = parseInt(rok);
    const user = useCurrentUser();
    const role = useCurrentRole();

    // Invalid Year State
    if (isNaN(year)) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Neplatný rok</h1>
                    <Link href="/vysledky" className="text-gray-400 hover:text-white underline">Zpět na přehled</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white selection:bg-blue-500/30 font-sans transition-colors duration-300">
            <Header user={user} role={role} mode="fixed" showGap={false} />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal opacity-50 dark:opacity-30" />
                <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-emerald-300/20 dark:bg-emerald-600/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-normal opacity-40 dark:opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-20 px-4 sm:px-8 lg:px-16 container mx-auto">
                {/* Header Navigation */}
                <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link
                        href="/vysledky"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Zpět na přehled sezón
                    </Link>

                    {/* Share Button Placeholder (can be functional later) */}
                    <button className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                        Sdílet výsledky
                    </button>
                </div>

                {/* Title Section */}
                <div className="flex items-end gap-6 mb-12 border-b border-gray-200 dark:border-white/10 pb-8">
                    <div className="hidden sm:flex items-center justify-center w-20 h-20 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-xl dark:shadow-2xl">
                        <CalendarDays className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur">
                                Oficiální výsledky
                            </span>
                            {year === new Date().getFullYear() && (
                                <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wider backdrop-blur">
                                    Probíhající
                                </span>
                            )}
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                            Sezóna <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400">{year}</span>
                        </h1>
                    </div>
                </div>

                {/* Client Component for Data */}
                <div className="min-h-[500px]">
                    <ResultsClient key={year} />
                </div>

            </main>

            <Footer user={user} role={role} />
        </div>
    );
}