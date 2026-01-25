"use client";

import { motion } from "framer-motion";
import { NewsItem } from "@/lib/news-service"; // We might need to duplicate specific types if not importing from server lib
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

// We define a local interface if imports from @/lib/news-service (server-only) fail in client components
// Actually, types from a separate file or shared file is better. 
// Assuming we copied types or they are available.
// For now, let's redefine NewsItem shape for component usage to avoid import errors if strictly server file.

interface NewsCardProps {
    item: any; // Using any temporarily to avoid type issues, will refine
    variant?: "light" | "dark";
    priority?: boolean;
}

export const NewsCard = ({ item, variant = "light", priority = false }: NewsCardProps) => {
    const isDark = variant === "dark";

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

    // Helper to get first image or placeholder
    const mainImage = item.images && item.images.length > 0 ? item.images[0].url : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300 h-full flex flex-col",
                isDark
                    ? "bg-black/40 border-white/10 text-white hover:bg-black/50 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                    : "bg-white border-gray-100 text-gray-900 shadow-sm hover:shadow-xl hover:border-gray-200"
            )}
        >
            {/* Image Container */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900/10">
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
                    <div className={cn("w-full h-full flex items-center justify-center", isDark ? "bg-white/5" : "bg-gray-100")}>
                        <span className={cn("text-4xl", isDark ? "opacity-20" : "opacity-10")}>📰</span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t opacity-60 transition-opacity group-hover:opacity-40",
                    isDark ? "from-black via-black/20 to-transparent" : "from-black/50 via-transparent to-transparent"
                )} />

                {/* Badge/Tags (if any) */}
                <div className="absolute top-4 right-4 flex gap-2">
                    {/* We can use item.tags here later */}
                    {item.tags && item.tags.length > 0 && (
                        <span className="px-3 py-1 rounded-full bg-blue-500/80 backdrop-blur text-white text-xs font-bold shadow-lg">
                            {item.tags[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-6 relative">
                <div className={cn("flex items-center gap-3 text-xs font-medium mb-3", isDark ? "text-gray-400" : "text-gray-500")}>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(item.createdAt)}
                    </div>
                </div>

                <h3 className={cn(
                    "text-xl font-bold leading-tight mb-3 line-clamp-2 group-hover:text-blue-500 transition-colors",
                    isDark ? "text-white" : "text-gray-900"
                )}>
                    {item.title}
                </h3>

                {item.summary && (
                    <p className={cn("text-sm line-clamp-3 mb-6", isDark ? "text-gray-300" : "text-gray-600")}>
                        {item.summary}
                    </p>
                )}

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-dashed border-gray-200/20">
                    <Link href={`/aktuality/${item.slug || item.id}`} className="block w-full">
                        <button className={cn(
                            "flex items-center gap-2 text-sm font-semibold transition-all group/btn w-full",
                            isDark ? "text-blue-400 group-hover:text-blue-300" : "text-blue-600 group-hover:text-blue-700"
                        )}>
                            Číst více
                            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                        </button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};
