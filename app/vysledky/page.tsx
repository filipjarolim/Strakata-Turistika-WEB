"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Calendar, Trophy, ArrowRight } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";

import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import { Skeleton } from "@/components/ui/skeleton";

// Using the news background or a specific one? 
// Plan suggests reusing assets or abstract dark bg.
// I'll reuse the dark aesthetics.

export default function SeasonsPage() {
    const user = useCurrentUser();
    const role = useCurrentRole();
    const [years, setYears] = useState<number[]>([]);
    const [filteredYears, setFilteredYears] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchSeasons() {
            setIsLoading(true);
            try {
                // Try to load from cache first for instant feel
                const cached = localStorage.getItem("cachedSeasons");
                if (cached) {
                    const parsed = JSON.parse(cached);
                    setYears(parsed);
                    setFilteredYears(parsed);
                    setIsLoading(false); // If cached, stop loading immediately (optimistic)
                }

                const res = await fetch("/api/seasons");
                if (!res.ok) throw new Error("Failed");
                const data: number[] = await res.json();
                const sorted = [...data].sort((a, b) => b - a);
                setYears(sorted);
                // Only update if cache mismatch or empty
                if (JSON.stringify(sorted) !== cached) {
                    setFilteredYears(sorted);
                    localStorage.setItem("cachedSeasons", JSON.stringify(sorted));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSeasons();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredYears(years);
        } else {
            setFilteredYears(
                years.filter(y => y.toString().includes(query.trim()))
            );
        }
    };

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariant = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 20 } }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white selection:bg-blue-500/30 font-sans transition-colors duration-300">
            <Header user={user} role={role} mode="fixed" theme="system" showGap={false} />

            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <main className="relative z-10 pt-24 sm:pt-32 pb-20 px-4 sm:px-8 lg:px-16 container mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12 sm:mb-16">
                    <div className="space-y-4 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 dark:bg-blue-500/10 border border-blue-600/20 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                            <Trophy className="w-3 h-3" />
                            Archiv výsledků
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-800 dark:text-white tracking-tight leading-none drop-shadow-sm dark:drop-shadow-2xl">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-400 dark:from-blue-400 dark:via-purple-400 dark:to-white">
                                Výsledky
                            </span>{" "}
                            Sezón
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                            Prohlédněte si historii výkonů, žebříčky a statistiky z uplynulých ročníků Strakaté Turistiky.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="w-full md:w-auto">
                        <div className="relative group w-full md:w-80">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur" />
                            <div className="relative bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-black/5 dark:border-white/10 flex items-center shadow-lg dark:shadow-2xl">
                                <Search className="w-5 h-5 text-gray-400 ml-4" />
                                <input
                                    type="text"
                                    placeholder="Hledat rok..."
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder:text-gray-500 py-3 sm:py-4 px-4 font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Years Grid */}
                {isLoading && filteredYears.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-48 rounded-3xl bg-gray-200 dark:bg-white/5" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                    >
                        {filteredYears.length > 0 ? (
                            filteredYears.map(year => (
                                <motion.div key={year} variants={itemVariant}>
                                    <Link href={`/vysledky/${year}`} className="block group h-full">
                                        <div className="relative h-full bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-500/50 backdrop-blur-md rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 shadow-sm hover:shadow-xl dark:shadow-none overflow-hidden flex flex-col justify-between min-h-[220px]">
                                            {/* Decorative Background Number */}
                                            <span className="absolute -right-4 -bottom-8 text-[120px] font-black text-gray-100 dark:text-white/5 group-hover:text-blue-500/5 dark:group-hover:text-blue-500/10 transition-colors pointer-events-none select-none z-0">
                                                {year}
                                            </span>

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    {year === new Date().getFullYear() && (
                                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-bold uppercase rounded-full border border-green-200 dark:border-green-500/30">
                                                            Aktuální
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {year}
                                                </h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    Kompletní výsledky
                                                </p>
                                            </div>

                                            <div className="relative z-10 pt-8 flex items-center text-sm font-semibold text-gray-900 dark:text-gray-500 dark:group-hover:text-white transition-colors">
                                                Zobrazit žebříček
                                                <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 mb-6">
                                    <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Žádné výsledky</h3>
                                <p className="text-gray-500 dark:text-gray-400">Pro zadaný rok "{searchQuery}" jsme nic nenašli.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* My Results Link Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 border-t border-gray-200 dark:border-white/10 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                    <div className="text-center sm:text-left">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Máte už odchozeno?</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Podívejte se na své osobní statistiky a historii.</p>
                    </div>
                    <Link href="/vysledky/moje">
                        <button className="px-8 py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg dark:shadow-white/5">
                            Moje Výsledky
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </Link>
                </motion.div>
            </main>

            <Footer user={user} role={role} />
        </div>
    );
}
