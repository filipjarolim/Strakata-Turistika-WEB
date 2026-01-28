'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, LucideIcon, Sliders, FileText, Database, Users, MapPin, Clock, CheckCircle, AlertCircle, Settings, Bug, Trophy, LayoutGrid } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Map of icons for dynamic rendering in client component
const iconMap = {
    Sliders,
    FileText,
    Database,
    Users,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    Settings,
    Bug,
    Trophy,
    LayoutGrid
};

export type IconName = keyof typeof iconMap;

interface AdminPageTemplateProps {
    title: string;
    subtitle?: string;
    category?: string;
    description?: string;
    icon?: IconName;
    children: React.ReactNode;
    actions?: React.ReactNode;
    search?: React.ReactNode;
    filters?: React.ReactNode;
    sorting?: React.ReactNode;
    backHref?: string;
    backLabel?: string;
    className?: string;
    containerClassName?: string;
}

export const AdminPageTemplate = ({
    title,
    subtitle = "Administrace",
    category = "Systém",
    description,
    icon,
    children,
    actions,
    search,
    filters,
    sorting,
    backHref,
    backLabel = "Zpět",
    className,
    containerClassName
}: AdminPageTemplateProps) => {
    const Icon = icon ? iconMap[icon] : null;

    return (
        <div className={cn("p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto relative z-10", className)}>
            {/* Header Section - Modern/Premium style */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2.5rem] shadow-sm">
                <div className="flex items-center gap-5">
                    {Icon && (
                        <div className="p-4 rounded-[1.25rem] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            <Icon className="w-7 h-7" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            {backHref && (
                                <Link
                                    href={backHref}
                                    className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1 mr-2"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                    {backLabel}
                                </Link>
                            )}
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                {subtitle} <span className="w-1 h-1 rounded-full bg-zinc-300" /> {category}
                            </p>
                        </div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1.5 opacity-80">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Toolbar Area */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {(search || filters || sorting) && (
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-white/5 p-1.5 rounded-2xl flex-1 xl:flex-none min-w-[200px]">
                            {search && <div className="flex-1">{search}</div>}
                            {filters && <div className="flex items-center gap-1">{filters}</div>}
                            {sorting && <div className="flex items-center gap-1">{sorting}</div>}
                        </div>
                    )}

                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                    "bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-[3rem] p-6 sm:p-10 shadow-xl relative overflow-hidden",
                    containerClassName
                )}
            >
                {/* Subtle internal glow */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        </div>
    );
};
