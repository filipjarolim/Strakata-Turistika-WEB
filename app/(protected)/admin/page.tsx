"use client";

import { admin } from "@/actions/auth/admin";
import { RoleGate } from "@/components/auth/role-gate";
import { FormSuccess } from "@/components/forms/form-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { useToast } from "@/hooks/use-toast"
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import React, { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Database, Settings, Users, FileText } from "lucide-react";

const collections = [
    "User",
    "Account",
    "VerificationToken",
    "PasswordResetToken",
    "TwoFactorToken",
    "TwoFactorConfirmation",
    "News",
    "Season",
    "VisitData",
];

type CollectionGroup = 'users' | 'authentication' | 'content';
type TabValue = 'all' | CollectionGroup;

// Group collections by category
const collectionGroups: Record<CollectionGroup, string[]> = {
    users: ["User", "Account"],
    authentication: ["VerificationToken", "PasswordResetToken", "TwoFactorToken", "TwoFactorConfirmation"],
    content: ["News", "Season", "VisitData"],
};

const AdminDashboardPage = () => {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<TabValue>("all");
    
    const filteredCollections = collections.filter((col) =>
        col.toLowerCase().includes(search.toLowerCase())
    );

    // Collections to display based on active tab
    const displayCollections = activeTab === "all" 
        ? filteredCollections 
        : filteredCollections.filter(col => {
            if (activeTab in collectionGroups) {
                return collectionGroups[activeTab as CollectionGroup].includes(col);
            }
            return false;
        });
    
    const noResults = displayCollections.length === 0;

    // Get icon for collection
    const getCollectionIcon = (collection: string) => {
        if (collectionGroups.users.includes(collection)) return <Users className="h-6 w-6 text-blue-500" />;
        if (collectionGroups.authentication.includes(collection)) return <Settings className="h-6 w-6 text-amber-500" />;
        if (collectionGroups.content.includes(collection)) return <FileText className="h-6 w-6 text-green-500" />;
        return <Database className="h-6 w-6 text-gray-500" />;
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col lg:flex-row justify-between gap-3 sm:gap-4 items-start lg:items-center">
                <h1 className="text-2xl sm:text-3xl font-bold">
                    <span className="hidden sm:inline">Admin Dashboard</span>
                    <span className="sm:hidden">Admin</span>
                </h1>
                <Input
                    type="text"
                    placeholder="Search collections..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:max-w-sm text-sm sm:text-base"
                />
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabValue)} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all">All Collections</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="authentication">Authentication</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="mt-0">
                    {noResults ? (
                        <div className="text-center p-8 border rounded-lg">
                            <p className="text-muted-foreground">No collections found matching &quot;{search}&quot;</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                            {displayCollections.map((col) => (
                                <Card key={col} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <CardHeader className="pb-2 p-4 sm:p-6">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="flex-shrink-0">
                                                {getCollectionIcon(col)}
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-lg sm:text-xl truncate">{col}</CardTitle>
                                                <CardDescription className="text-sm">
                                                    <span className="hidden sm:inline">Manage {col} data</span>
                                                    <span className="sm:hidden">Manage data</span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="pt-3 sm:pt-4 p-4 sm:p-6">
                                        <Link href={`/admin/${col}`} className="w-full block">
                                            <Button variant="default" className="w-full text-sm sm:text-base">
                                                <span className="hidden sm:inline">View Records</span>
                                                <span className="sm:hidden">View</span>
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

const AdminPage = () => {
    const { toast } = useToast();
    const user = useCurrentUser();
    const role = useCurrentRole();

    const onServerActionClick = () => {
        admin().then((data) => {
            if (data.error) {
                toast({
                    title: "Error",
                    description: data.error,
                    variant: "destructive",
                });
            }

            if (data.success) {
                toast({
                    title: "Success",
                    description: data.success,
                    variant: "default",
                });
            }
        });
    };

    const onApiRouteClick = () => {
        fetch("/api/admin").then((response) => {
            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Allowed API Route!",
                    variant: "default",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Forbidden API Route!",
                    variant: "destructive",
                });
            }
        });
    };

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <RoleGate allowedRole={UserRole.ADMIN}>
                <div className="space-y-6">
                    <FormSuccess message="You are allowed to see this content!" />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="p-4 sm:p-6">
                                <CardTitle className="text-lg sm:text-xl">
                                    <span className="hidden sm:inline">Admin API Testing</span>
                                    <span className="sm:hidden">API Testing</span>
                                </CardTitle>
                                <CardDescription className="text-sm">Test admin-only API endpoints</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-3 gap-2 sm:gap-0">
                                    <p className="text-xs sm:text-sm font-medium">Admin-only API Route</p>
                                    <Button onClick={onApiRouteClick} size="sm" className="w-full sm:w-auto">Test</Button>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-3 gap-2 sm:gap-0">
                                    <p className="text-xs sm:text-sm font-medium">Admin-only Server Action</p>
                                    <Button onClick={onServerActionClick} size="sm" className="w-full sm:w-auto">Test</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <AdminDashboardPage />
                </div>
            </RoleGate>
        </CommonPageTemplate>
    );
};

export default AdminPage;