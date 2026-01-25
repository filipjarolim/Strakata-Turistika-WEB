"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface NewsItem {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    published: boolean;
    createdAt: Date | string;
    images?: { url: string }[];
}

interface FeaturedNewsProps {
    items: NewsItem[];
    autoPlayInterval?: number;
}

export const FeaturedNews = ({ items, autoPlayInterval = 5000 }: FeaturedNewsProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (items.length <= 1 || isPaused) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [items.length, autoPlayInterval, isPaused]);

    if (!items || items.length === 0) return null;

    const currentItem = items[currentIndex];
    const image = currentItem.images && currentItem.images.length > 0 ? currentItem.images[0].url : null;

    const navigate = (direction: "prev" | "next") => {
        if (direction === "prev") {
            setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
        } else {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }
    };

    return (
        <div
            className="relative w-full aspect-[21/9] min-h-[400px] max-h-[600px] rounded-3xl overflow-hidden group shadow-2xl border border-white/10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image */}
                    {image ? (
                        <Image
                            src={image}
                            alt={currentItem.title}
                            fill
                            priority
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                            <span className="text-6xl opacity-10">📰</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 md:p-16 z-10 flex flex-col items-start gap-4">
                <motion.div
                    key={`content-${currentIndex}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="max-w-3xl"
                >
                    <div className="flex items-center gap-3 text-sm text-blue-300 font-medium mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur">
                            Novinka
                        </span>
                        <span className="flex items-center gap-1.5 opacity-80">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(currentItem.createdAt), "d. MMMM yyyy", { locale: cs })}
                        </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-xl">
                        {currentItem.title}
                    </h2>

                    {currentItem.summary && (
                        <p className="text-lg text-gray-200 line-clamp-2 md:line-clamp-3 mb-6 max-w-2xl drop-shadow-md font-light">
                            {currentItem.summary}
                        </p>
                    )}

                    <Link href={`/aktuality/${currentItem.slug || currentItem.id}`}>
                        <button className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-transform shadow-lg shadow-white/10">
                            Číst celý článek
                        </button>
                    </Link>
                </motion.div>
            </div>

            {/* Navigation Buttons */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={() => navigate("prev")}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-md text-white/50 hover:bg-black/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigate("next")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-md text-white/50 hover:bg-black/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 right-6 flex gap-2 z-20">
                        {items.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    idx === currentIndex ? "w-8 bg-white" : "bg-white/30 hover:bg-white/50"
                                )}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
