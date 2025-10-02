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
    ChevronRight
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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