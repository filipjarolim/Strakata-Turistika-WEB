'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, LucideIcon, Sliders, FileText, Database, Users, MapPin, Clock, CheckCircle, AlertCircle, Settings, Bug, Trophy } from 'lucide-react';
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
    Trophy
};

export type IconName = keyof typeof iconMap;

interface AdminPageTemplateProps {
    title: string;
    description?: string;
    icon?: IconName;
    children: React.ReactNode;
    actions?: React.ReactNode;
    backHref?: string;
    backLabel?: string;
    className?: string;
    containerClassName?: string;
}

export const AdminPageTemplate = ({
    title,
    description,
    icon,
    children,
    actions,
    backHref = "/admin",
    backLabel = "Zpět na admin dashboard",
    className,
    containerClassName
}: AdminPageTemplateProps) => {
    const Icon = icon ? iconMap[icon] : null;

    return (
        <div className={cn("p-4 sm:p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative z-10", className)}>
            {/* Header Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-4">
                        {backHref && (
                            <Link
                                href={backHref}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white inline-flex items-center gap-1 transition-colors group"
                            >
                                <ChevronLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
                                {backLabel}
                            </Link>
                        )}
                        <div className="flex items-center gap-4">
                            {Icon && (
                                <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 shadow-sm backdrop-blur-md">
                                    <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-200 dark:to-gray-400">
                                    {title}
                                </h1>
                                {description && (
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                        {description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    {actions && (
                        <div className="flex items-center gap-3">
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
                    "bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-xl relative overflow-hidden",
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
