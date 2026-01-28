'use client';

import { RoleGate } from "@/components/auth/role-gate";
import { UserRole } from "@prisma/client";
import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";
import React from "react";
import Link from "next/link";
import {
    Database,
    Users,
    FileText,
    MapPin,
    Sliders,
    ChevronRight,
    Server,
    BarChart,
    LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

// Main collections for admin dashboard
const mainCollections = [
    {
        name: "VisitData",
        title: "Návštěvy",
        description: "Správa turistických návštěv a tras. Schvalování a kontrola.",
        icon: MapPin,
        href: "/admin/VisitData",
        gradient: "from-green-500/10 to-emerald-500/10",
        border: "border-green-500/10",
        iconColor: "text-green-600 dark:text-green-400"
    },
    {
        name: "User",
        title: "Uživatelé",
        description: "Správa uživatelských účtů a oprávnění.",
        icon: Users,
        href: "/admin/User",
        gradient: "from-blue-500/10 to-cyan-500/10",
        border: "border-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
        name: "News",
        title: "Aktuality",
        description: "Správa novinek, článků a oznámení.",
        icon: FileText,
        href: "/admin/news",
        gradient: "from-purple-500/10 to-violet-500/10",
        border: "border-purple-500/10",
        iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
        name: "Formular",
        title: "Formuláře",
        description: "Nastavení bodování, typů míst a formulářů.",
        icon: Sliders,
        href: "/admin/formular",
        gradient: "from-orange-500/10 to-amber-500/10",
        border: "border-orange-500/10",
        iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
        name: "Scoring",
        title: "Bodování",
        description: "Centrální správa bodování a typů míst.",
        icon: Sliders,
        href: "/admin/scoring",
        gradient: "from-blue-500/10 to-indigo-500/10",
        border: "border-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
        name: "CustomRoute",
        title: "Strakatá Cesta",
        description: "Správa a schvalování tras vytvořených uživateli.",
        icon: MapPin,
        href: "/admin/CustomRoute",
        gradient: "from-amber-500/10 to-yellow-500/10",
        border: "border-amber-500/10",
        iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
        name: "StrataCategory",
        title: "Kategorie",
        description: "Správa soutěžních kategorií a jejich parametrů.",
        icon: LayoutGrid,
        href: "/admin/StrataCategory",
        gradient: "from-green-500/10 to-emerald-500/10",
        border: "border-green-500/10",
        iconColor: "text-green-600 dark:text-green-400"
    },
    {
        name: "Stats",
        title: "Výsledky & Statistiky",
        description: "Prohlížení aktuálního žebříčku a detailních statistik.",
        icon: BarChart,
        href: `/vysledky/${new Date().getFullYear()}`,
        gradient: "from-pink-500/10 to-rose-500/10",
        border: "border-pink-500/10",
        iconColor: "text-pink-600 dark:text-pink-400"
    }
];

const AdminDashboardPage = () => {
    return (
        <AdminPageTemplate
            title="Administrace"
            description="Centrální správa aplikace."
            icon="Sliders"
            backHref="/"
            backLabel="Zpět na hlavní stránku"
            containerClassName="bg-transparent border-none shadow-none backdrop-blur-none p-0 sm:p-0"
        >
            <div className="space-y-12">

                {/* Main Hub Grid */}
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {mainCollections.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} href={item.href} className="group relative">
                                    <div className={cn(
                                        "absolute inset-0 rounded-[2rem] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
                                        item.gradient
                                    )} />
                                    <div className={cn(
                                        "relative h-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 transition-all duration-300",
                                        "hover:-translate-y-1 hover:shadow-xl dark:hover:bg-white/10",
                                        item.border
                                    )}>
                                        <div className={cn("inline-flex p-3 rounded-2xl mb-6 bg-gray-50 dark:bg-white/5", item.iconColor)}>
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                                            {item.description}
                                        </p>

                                        <div className="absolute bottom-8 left-8 flex items-center text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            Otevřít <ChevronRight className="h-3 w-3 ml-1" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* System Tools */}
                <div className="pt-8 border-t border-gray-200 dark:border-white/10">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 px-1">Nástroje & Data</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                        {/* New Database Link */}
                        <Link href="/admin/database" className="group">
                            <div className="h-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">Databáze</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Prohlížení raw dat, kolekcí a systémových záznamů.
                                </p>
                            </div>
                        </Link>

                        {/* System Collections Links */}
                        {[
                            { name: "Account", label: "Propojené účty" },
                            { name: "VerificationToken", label: "Verifikační tokeny" },
                            { name: "Season", label: "Sezóny" },
                            { name: "debug", label: "Debug Tools", icon: Server }
                        ].map((col) => (
                            <Link key={col.name} href={col.name === 'debug' ? '/admin/debug' : `/admin/${col.name}`} className="group">
                                <div className="h-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        {col.icon ? (
                                            <div className="p-1.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white">
                                                <col.icon className="h-4 w-4" />
                                            </div>
                                        ) : (
                                            <div className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-600 group-hover:bg-blue-500 transition-colors" />
                                        )}
                                        <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">{col.label}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
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