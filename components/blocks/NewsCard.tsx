"use client";

import { motion } from "framer-motion";
import { NewsItem } from "@/lib/news-service";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface NewsCardProps {
    item: NewsItem;
    priority?: boolean;
    view?: "grid" | "list";
}

export const NewsCard = ({ item, priority = false, view = "grid" }: NewsCardProps) => {
    const formatDate = (date: Date | string) => {
        try {
            return format(new Date(date), "d. MMMM yyyy", { locale: cs });
        } catch (e) { return ''; }
    };

    const formatTime = (date: Date | string) => {
        try {
            return format(new Date(date), "HH:mm", { locale: cs });
        } catch (e) { return ''; }
    };

    const mainImage = item.images && item.images.length > 0 ? item.images[0].url : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300 flex",
                view === "list" ? "flex-row items-stretch h-32 sm:h-auto" : "flex-col h-full",
                "bg-white dark:bg-black/40 border-gray-100 dark:border-white/10 text-gray-900 dark:text-white",
                "shadow-sm hover:shadow-xl hover:border-gray-200 dark:hover:border-white/20 hover:bg-white dark:hover:bg-black/50"
            )}
        >
            {/* Image Container */}
            <div className={cn(
                "relative overflow-hidden bg-gray-900/10 dark:bg-white/5",
                view === "list" ? "w-1/3 min-w-[33%] h-full" : "w-full h-48 sm:h-auto sm:aspect-[16/10]"
            )}>
                {mainImage ? (
                    <Image
                        src={mainImage}
                        alt={item.title}
                        fill
                        priority={priority}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5">
                        <span className="text-4xl opacity-10 dark:opacity-20">📰</span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t opacity-60 transition-opacity group-hover:opacity-40",
                    "from-black/50 via-transparent to-transparent dark:from-black dark:via-black/20"
                )} />

                {/* Badge/Tags - Hide on list view mobile if crowded, or keep small */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {item.tags && item.tags.length > 0 && (
                        <span className={cn(
                            "px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur text-white text-xs font-bold shadow-lg",
                            view === "list" && "hidden sm:inline-flex"
                        )}>
                            {item.tags[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={cn("flex flex-col flex-1 relative", view === "list" ? "p-3 sm:p-6" : "p-6")}>
                <div className="flex items-center gap-3 text-xs font-medium mb-2 sm:mb-3 text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                    </div>
                    {view !== "list" && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(item.createdAt)}
                        </div>
                    )}
                </div>

                <h3 className={cn(
                    "font-bold leading-tight mb-2 sm:mb-3 line-clamp-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
                    view === "list" ? "text-base sm:text-xl" : "text-lg sm:text-xl"
                )}>
                    {item.title}
                </h3>

                {item.summary && view !== "list" && (
                    <p className="text-sm line-clamp-3 mb-6 text-gray-600 dark:text-gray-300">
                        {item.summary}
                    </p>
                )}

                {/* For List View, maybe hide summary on mobile or show fewer lines if space */}
                {view === "list" && (
                    <p className="text-xs sm:text-sm line-clamp-2 mb-2 text-gray-600 dark:text-gray-300 hidden sm:block">
                        {item.summary}
                    </p>
                )}

                <div className={cn("mt-auto flex items-center justify-between border-t border-dashed border-gray-100 dark:border-white/10", view === "list" ? "pt-2 sm:pt-4" : "pt-4")}>
                    <Link href={`/aktuality/${item.slug || item.id}`} className="block w-full">
                        <button className="flex items-center gap-2 text-sm font-semibold transition-all group/btn w-full text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            Číst více
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

