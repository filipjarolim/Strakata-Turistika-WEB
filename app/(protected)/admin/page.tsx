"use client";

import { admin } from "@/actions/auth/admin";
import { RoleGate } from "@/components/auth/role-gate";
import { FormSuccess } from "@/components/forms/form-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { ToastAction } from "@/components/ui/toast";
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
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Input
                    type="text"
                    placeholder="Search collections..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayCollections.map((col) => (
                                <Card key={col} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            {getCollectionIcon(col)}
                                            <div>
                                                <CardTitle className="text-xl">{col}</CardTitle>
                                                <CardDescription>Manage {col} data</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <Separator />
                                    <CardContent className="pt-4">
                                        <Link href={`/admin/${col}`} className="w-full block">
                                            <Button variant="default" className="w-full">
                                                View Records
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
                    action: (
                        <ToastAction altText="Dismiss">Dismiss</ToastAction>
                    ),
                });
            }

            if (data.success) {
                toast({
                    title: "Success",
                    description: data.success,
                    variant: "default",
                    action: (
                        <ToastAction altText="Close">Close</ToastAction>
                    ),
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
                    action: (
                        <ToastAction altText="Close">Close</ToastAction>
                    ),
                });
            } else {
                toast({
                    title: "Error",
                    description: "Forbidden API Route!",
                    variant: "destructive",
                    action: (
                        <ToastAction altText="Dismiss">Dismiss</ToastAction>
                    ),
                });
            }
        });
    };

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <RoleGate allowedRole={UserRole.ADMIN}>
                <div className="space-y-6">
                    <FormSuccess message="You are allowed to see this content!" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin API Testing</CardTitle>
                                <CardDescription>Test admin-only API endpoints</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <p className="text-sm font-medium">Admin-only API Route</p>
                                    <Button onClick={onApiRouteClick}>Test</Button>
                                </div>

                                <div className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <p className="text-sm font-medium">Admin-only Server Action</p>
                                    <Button onClick={onServerActionClick}>Test</Button>
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