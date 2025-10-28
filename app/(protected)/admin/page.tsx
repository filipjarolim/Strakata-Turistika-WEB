'use client';

import { RoleGate } from "@/components/auth/role-gate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Bug
} from "lucide-react";

// Main collections for admin dashboard
const mainCollections = [
    {
        name: "VisitData",
        title: "Návštěvy",
        description: "Správa turistických návštěv a tras",
        icon: MapPin,
        color: "text-green-600",
        bgColor: "bg-green-50",
        href: "/admin/VisitData"
    },
    {
        name: "User",
        title: "Uživatelé",
        description: "Správa uživatelských účtů",
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        href: "/admin/User"
    },
    {
        name: "News",
        title: "Aktuality",
        description: "Správa novinek a článků",
        icon: FileText,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        href: "/admin/News"
    },
    {
        name: "Formular",
        title: "Nastavení formuláře",
        description: "Bodování, pole a typy míst",
        icon: Sliders,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        href: "/admin/formular"
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
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Správa turistické aplikace
                    </p>
                </div>
            </div>

            {/* VisitData Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">Celkem návštěv</p>
                            <p className="text-lg sm:text-xl font-bold">
                                {loading ? "..." : visitDataStats.total}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">Čekající</p>
                            <p className="text-lg sm:text-xl font-bold">
                                {loading ? "..." : visitDataStats.pending}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">Schválené</p>
                            <p className="text-lg sm:text-xl font-bold">
                                {loading ? "..." : visitDataStats.approved}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground">Zamítnuté</p>
                            <p className="text-lg sm:text-xl font-bold">
                                {loading ? "..." : visitDataStats.rejected}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Collections */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg sm:text-xl font-semibold">Hlavní správa</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {mainCollections.map((collection) => {
                        const IconComponent = collection.icon;
                        return (
                            <Card key={collection.name} className="group hover:shadow-md transition-all duration-200">
                                <Link href={collection.href} className="block">
                                    <CardHeader className="p-4 sm:p-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-lg ${collection.bgColor}`}>
                                                <IconComponent className={`h-6 w-6 ${collection.color}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <CardTitle className="text-base sm:text-lg truncate">
                                                    {collection.title}
                                                </CardTitle>
                                                <CardDescription className="text-sm text-muted-foreground">
                                                    {collection.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 pt-0">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">
                                                {collection.name}
                                            </Badge>
                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Database Usage */}
            {databaseStats && (
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg">Databázové statistiky</CardTitle>
                            </div>
                            <Link href="/admin/debug">
                                <Button variant="outline" size="sm">
                                    <Bug className="h-4 w-4 mr-2" />
                                    Debug View
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Database Size Info */}
                        {databaseStats.size && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Celková velikost dat</p>
                                        <p className="text-lg font-bold">{databaseStats.size.totalSizeMB} MB</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Storage size</p>
                                        <p className="text-lg font-bold">{databaseStats.size.storageSizeMB} MB</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Indexy</p>
                                        <p className="text-lg font-bold">{databaseStats.size.indexSizeMB} MB</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Celkem záznamů</p>
                                        <p className="text-lg font-bold text-primary">{databaseStats.totalRecords}</p>
                                    </div>
                                </div>
                                {databaseStats.size.freeSpaceMB !== null && databaseStats.size.totalSpaceMB !== null && (
                                    <div className={`p-3 rounded-lg border ${
                                        databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 80 
                                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' 
                                            : databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 60 
                                                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
                                                : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                                    }`}>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Volné místo</p>
                                                <p className={`text-lg font-bold ${
                                                    databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 80 
                                                        ? 'text-red-600' 
                                                        : 'text-green-600'
                                                }`}>
                                                    {databaseStats.size.freeSpaceMB} MB
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Celková kapacita</p>
                                                <p className="text-lg font-bold">
                                                    {databaseStats.size.totalSpaceMB} MB
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Limit MongoDB</p>
                                                <p className="text-lg font-bold">
                                                    {databaseStats.size.maxSizeMB ? `${databaseStats.size.maxSizeMB} MB` : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Vyčerpáno</p>
                                                <p className={`text-lg font-bold ${
                                                    databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 80 
                                                        ? 'text-red-600' 
                                                        : databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 60 
                                                            ? 'text-yellow-600'
                                                            : 'text-primary'
                                                }`}>
                                                    {databaseStats.size.percentageUsed ? `${databaseStats.size.percentageUsed}%` : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 60 && (
                                            <div className={`mb-3 p-2 rounded text-xs ${
                                                databaseStats.size.percentageUsed > 80 
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                            }`}>
                                                ⚠️ Varování: Databáze je {databaseStats.size.percentageUsed > 80 ? 'téměř plná' : 'naplněná'}! Zvažte upgrade plánu nebo vyčištění starých dat.
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-xs text-muted-foreground">Využití prostoru</p>
                                                <p className="text-xs font-semibold">
                                                    {databaseStats.size.percentageUsed ? `${databaseStats.size.percentageUsed}%` : 
                                                        databaseStats.size.totalSpaceMB && databaseStats.size.freeSpaceMB 
                                                            ? (((databaseStats.size.totalSpaceMB - databaseStats.size.freeSpaceMB) / databaseStats.size.totalSpaceMB) * 100).toFixed(1) + '%'
                                                            : '0%'}
                                                </p>
                                            </div>
                                            <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2.5">
                                                <div 
                                                    className={`h-2.5 rounded-full transition-all ${
                                                        databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 80 
                                                            ? 'bg-red-600 dark:bg-red-500' 
                                                            : databaseStats.size.percentageUsed && databaseStats.size.percentageUsed > 60 
                                                                ? 'bg-yellow-600 dark:bg-yellow-500'
                                                                : 'bg-blue-600 dark:bg-blue-500'
                                                    }`}
                                                    style={{ 
                                                        width: databaseStats.size.percentageUsed ? `${databaseStats.size.percentageUsed}%` :
                                                            databaseStats.size.totalSpaceMB && databaseStats.size.freeSpaceMB 
                                                                ? `${((databaseStats.size.totalSpaceMB - databaseStats.size.freeSpaceMB) / databaseStats.size.totalSpaceMB * 100).toFixed(1)}%` 
                                                                : '0%'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top collections by size */}
                        {databaseStats.size?.topCollections && databaseStats.size.topCollections.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold mb-2">Největší kolekce:</p>
                                <div className="space-y-2">
                                    {databaseStats.size.topCollections.map((item: { name: string; sizeMB: number; count: number }) => {
                                        // Convert camelCase to Title Case for display
                                        const withSpaces = item.name.replace(/([A-Z])/g, ' $1').trim();
                                        const displayName = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
                                        return (
                                            <div key={item.name} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{displayName}</span>
                                                <div className="flex items-center gap-3">
                                                    <span>{item.sizeMB} MB</span>
                                                    <span className="text-muted-foreground">({item.count} záz.)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Collection counts - compact */}
                        <div>
                            <p className="text-sm font-semibold mb-2">Počty záznamů:</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {Object.entries(databaseStats.stats).map(([key, value]) => {
                                    // Convert camelCase to Title Case for display
                                    const withSpaces = key.replace(/([A-Z])/g, ' $1').trim();
                                    const displayName = withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
                                    return (
                                        <div key={key} className="flex flex-col items-center p-2 bg-muted/30 rounded">
                                            <p className="text-xs text-muted-foreground text-center truncate w-full">{displayName}</p>
                                            <p className="text-base font-bold">{value}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}


            {/* Advanced Collections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-lg sm:text-xl font-semibold">Pokročilé</h2>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        Systémové
                    </Badge>
                </div>
                
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                            {advancedCollections.map((collection) => (
                                <Link key={collection} href={`/admin/${collection}`}>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full h-auto p-3 flex flex-col gap-1 text-xs"
                                    >
                                        <Database className="h-4 w-4" />
                                        <span className="truncate">{collection}</span>
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AdminPage = () => {
    const user = useCurrentUser();
    const role = useCurrentRole();

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
            <RoleGate allowedRole={UserRole.ADMIN}>
                <AdminDashboardPage />
            </RoleGate>
        </CommonPageTemplate>
    );
};

export default AdminPage;