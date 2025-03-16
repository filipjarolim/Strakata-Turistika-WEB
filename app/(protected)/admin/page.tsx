"use client";

import { admin } from "@/actions/auth/admin";
import { RoleGate } from "@/components/auth/role-gate";
import { FormSuccess } from "@/components/forms/form-success";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast"
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import React, { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import Link from "next/link";
import { Input } from "@/components/ui/input";

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

const AdminDashboardPage = () => {
    const [search, setSearch] = useState("");
    const filteredCollections = collections.filter((col) =>
        col.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            <Input
                type="text"
                placeholder="Search collections..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 max-w-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCollections.map((col) => (
                    <Card key={col} className="p-4">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">{col}</h2>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-2">Manage {col} data</p>
                            <Link href={`/admin/${col}`}>
                                <Button variant="default" className="w-full">
                                    View Records
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
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
                <FormSuccess message="You are allowed to see this content!" />

                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
                    <p className="text-sm font-medium">Admin-only API Route</p>
                    <Button onClick={onApiRouteClick}>Click to test</Button>
                </div>

                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
                    <p className="text-sm font-medium">Admin-only Server Action</p>
                    <Button onClick={onServerActionClick}>Click to test</Button>
                </div>

                <AdminDashboardPage />

            </RoleGate>
        </CommonPageTemplate>
    );
};

export default AdminPage;