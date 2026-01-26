'use client';

import { RoleGate } from "@/components/auth/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import React, { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import Link from "next/link";
import {
    Database,
    Settings,
    Users,
    FileText,
    MapPin,
    Clock,
    CheckCircle,
    AlertCircle,
    BarChart3,
    ChevronRight,
    Sliders,
    Bug,
    Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";

// Main collections for admin dashboard
const mainCollections = [
    {
        name: "VisitData",
        title: "Návštěvy",
        description: "Správa turistických návštěv a tras",
        icon: MapPin,
        href: "/admin/VisitData",
        gradient: "from-green-500/20 to-emerald-500/20",
        border: "border-green-500/20",
        iconColor: "text-green-600 dark:text-green-400"
    },
    {
        name: "User",
        title: "Uživatelé",
        description: "Správa uživatelských účtů",
        icon: Users,
        href: "/admin/User",
        gradient: "from-blue-500/20 to-cyan-500/20",
        border: "border-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
        name: "News",
        title: "Aktuality",
        description: "Správa novinek a článků",
        icon: FileText,
        href: "/admin/news",
        gradient: "from-purple-500/20 to-violet-500/20",
        border: "border-purple-500/20",
        iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
        name: "Formular",
        title: "Nastavení formuláře",
        description: "Bodování a typy míst",
        icon: Sliders,
        href: "/admin/formular",
        gradient: "from-orange-500/20 to-amber-500/20",
        border: "border-orange-500/20",
        iconColor: "text-orange-600 dark:text-orange-400"
    }
];

// Advanced collections
const advancedCollections = [
    "Account",
    "VerificationToken",
    "PasswordResetToken",
    "TwoFactorToken",
    "TwoFactorConfirmation",
    "Season"
];

const AdminDashboardPage = () => {
    const [visitDataStats, setVisitDataStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [databaseStats, setDatabaseStats] = useState<{
        stats: Record<string, number>;
        totalRecords: number;
        size: {
            totalSizeMB?: number;
            storageSizeMB?: number;
            indexSizeMB?: number;
            freeSpaceMB?: number | null;
            totalSpaceMB?: number | null;
            maxSizeMB?: number | null;
            percentageUsed?: number | null;
            topCollections?: Array<{ name: string; sizeMB: number; count: number }>;
        } | null;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    // Load VisitData statistics
    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await fetch('/api/admin/stats');
                if (response.ok) {
                    const data = await response.json();
                    setVisitDataStats({
                        total: data.total || 0,
                        pending: data.pending || 0,
                        approved: data.approved || 0,
                        rejected: data.rejected || 0
                    });
                    if (data.database) {
                        setDatabaseStats(data.database);
                    }
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <AdminPageTemplate
            title="Admin Dashboard"
            description="Centrální správa aplikace a systémová data."
            icon="Sliders"
            backHref="/"
            backLabel="Zpět na hlavní stránku"
            containerClassName="bg-transparent border-none shadow-none backdrop-blur-none p-0 sm:p-0"
        >
            <div className="space-y-10">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {[
                        { label: "Celkem", value: visitDataStats.total, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/5", icon: MapPin },
                        { label: "Čekající", value: visitDataStats.pending, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/5", icon: Clock },
                        { label: "Schváleno", value: visitDataStats.approved, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/5", icon: CheckCircle },
                        { label: "Zamítnuto", value: visitDataStats.rejected, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-500/5", icon: AlertCircle },
                    ].map((stat, i) => (
                        <div key={i} className="group relative">
                            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col items-start transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm">
                                <div className={cn("p-2 rounded-xl mb-4", stat.bgColor)}>
                                    <stat.icon className={cn("h-4 w-4", stat.color)} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{stat.label}</span>
                                <span className={cn("text-2xl font-black tracking-tight", stat.color)}>
                                    {loading ? "..." : new Intl.NumberFormat('cs-CZ').format(stat.value)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Hub Grid */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white px-2">Správa obsahu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mainCollections.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} href={item.href} className="group relative">
                                    <div className={cn(
                                        "absolute inset-0 rounded-[2.5rem] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl",
                                        item.gradient
                                    )} />
                                    <div className={cn(
                                        "relative h-full bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-[2.5rem] p-8 transition-all duration-500",
                                        "group-hover:translate-y-[-8px] dark:group-hover:border-white/20 group-hover:shadow-2xl group-hover:bg-white/80 dark:group-hover:bg-white/10",
                                        item.border
                                    )}>
                                        <div className={cn("p-4 rounded-[1.5rem] w-fit mb-6 bg-white dark:bg-white/10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3", item.iconColor)}>
                                            <Icon className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>

                                        <div className="mt-6 flex items-center text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
                                            Spravovat <ChevronRight className="h-4 w-4 ml-1" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Advanced Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white px-1">
                        Systémové kolekce
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {[
                            "Account",
                            "VerificationToken",
                            "PasswordResetToken",
                            "TwoFactorToken",
                            "TwoFactorConfirmation",
                            "Season"
                        ].map((col) => (
                            <Link key={col} href={`/admin/${col}`}>
                                <div className="group bg-zinc-50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700">
                                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors tracking-tight line-clamp-1">{col}</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Database Usage Stats Visualization if present */}
                    {databaseStats && (
                        <div className="relative group overflow-hidden bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-[2.5rem] p-8 mt-10 shadow-sm hover:shadow-xl transition-all duration-500">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500">
                                <Database className="h-48 w-48 text-blue-500" />
                            </div>

                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                    <Database className="h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Využití databáze</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Celková velikost</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{databaseStats.size?.totalSizeMB || 0} <span className="text-base font-bold text-gray-400">MB</span></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Velikost indexů</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{databaseStats.size?.indexSizeMB || 0} <span className="text-base font-bold text-gray-400">MB</span></p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Počet záznamů</p>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white">{new Intl.NumberFormat('cs-CZ').format(databaseStats.totalRecords || 0)}</p>
                                </div>
                            </div>

                            {/* Debug tool link */}
                            <div className="mt-10 pt-8 border-t border-gray-200/50 dark:border-white/5 flex justify-end">
                                <Link href="/admin/debug">
                                    <Button variant="outline" size="sm" className="rounded-full gap-2 text-xs font-bold uppercase tracking-wider border-gray-200/50 dark:border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50">
                                        <Bug className="h-4 w-4" /> Debugging Tools
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminPageTemplate>
    );
};

const AdminPage = () => {
    return (
        <RoleGate allowedRole={UserRole.ADMIN}>
            <AdminDashboardPage />
        </RoleGate>
    );
};

export default AdminPage;