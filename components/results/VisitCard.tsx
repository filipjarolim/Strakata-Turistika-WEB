
"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { Calendar, User, Dog, Map as MapIcon } from "lucide-react";
import { VisitDataWithUser } from "@/lib/results-utils";
import { RoutePreviewSVG } from "@/components/results/RoutePreviewSVG";
import { TileBackground } from "@/components/results/TileBackground";
import { cn } from "@/lib/utils";

interface VisitCardProps {
    visit: VisitDataWithUser;
    onClick?: () => void;
    className?: string; // Additional classes
}

export const VisitCard: React.FC<VisitCardProps> = ({ visit, onClick, className }) => {
    const hasRoute = visit.route && visit.route.trackPoints?.length > 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={onClick}
            className={cn(
                "group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 dark:hover:border-blue-500/30 rounded-3xl overflow-hidden cursor-pointer backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10",
                className
            )}
        >
            {/* Preview / Map Area */}
            <div className="h-40 w-full relative bg-gray-100 dark:bg-black/40 flex items-center justify-center overflow-hidden">
                {hasRoute ? (
                    // Map Background with Route Line
                    <div className="w-full h-full relative group-hover:opacity-100 transition-opacity">
                        <TileBackground trackPoints={visit.route!.trackPoints} className="opacity-50 grayscale dark:invert dark:opacity-30" zoom={11} />
                        <div className="absolute inset-0 p-4 opacity-90">
                            <RoutePreviewSVG trackPoints={visit.route!.trackPoints} color="#3B82F6" strokeWidth={3} />
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        <Image
                            src="/images/misc/no-preview.png"
                            alt=""
                            fill
                            className="object-cover opacity-80"
                            unoptimized
                            priority
                        />
                    </div>
                )}
                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-black/60 backdrop-blur rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-black/5 dark:border-white/10 flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3 h-3" />
                    {visit.visitDate ? format(new Date(visit.visitDate), "d.M.", { locale: cs }) : "?"}
                </div>
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {visit.state === 'APPROVED' && (
                        <div className="px-2 py-1 bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold shadow-sm">
                            {visit.points} b
                        </div>
                    )}
                    {visit.state === 'PENDING_REVIEW' && (
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold shadow-sm">
                            Čeká na kontrolu
                        </div>
                    )}
                    {visit.state === 'REJECTED' && (
                        <div className="px-2 py-1 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold shadow-sm">
                            Zamítnuto
                        </div>
                    )}
                    {visit.state === 'DRAFT' && (
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-500/20 border border-gray-200 dark:border-gray-500/30 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold shadow-sm">
                            Draft
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {visit.routeTitle || "Neznámá trasa"}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <User className="w-3 h-3" />
                    {visit.displayName}
                    {visit.user?.dogName && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <Dog className="w-3 h-3" />
                            {visit.user.dogName}
                        </>
                    )}
                </div>

                {/* Places Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {visit.visitedPlaces.split(',').slice(0, 3).map((p, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                            {p.trim()}
                        </span>
                    ))}
                    {visit.visitedPlaces.split(',').length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] text-gray-600 dark:text-gray-400">+</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
