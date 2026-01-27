"use client";

import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Database } from "lucide-react";
import React, { useEffect, useState } from "react";

interface CollectionData {
    collections: string[];
}

export default function DatabasePage() {
    const [collections, setCollections] = useState<string[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<string>("");
    const [data, setData] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        const fetchCollections = async () => {
            setLoading(true);
            try {
                // We'll reuse the stats endpoint or create a new one. 
                // Since we don't have a direct "list collections" API in the plan,
                // we can infer them or I'll create a simple server action / API route.
                // For now, I'll hardcode the known Prisma models as "Collections" 
                // or try to fetch from a new endpoint if I were to make one.
                // Let's use the known schema models for now to be safe.
                const models = [
                    "User",
                    "Account",
                    "VerificationToken",
                    "PasswordResetToken",
                    "TwoFactorToken",
                    "TwoFactorConfirmation",
                    "News",
                    "Season",
                    "VisitData",
                    "MonthlyTheme",
                    "CustomRoute",
                    "Rules",
                    "ScoringConfig",
                    "PlaceTypeConfig",
                    "FormField",
                    "FormConfig"
                ];
                setCollections(models);
                if (models.length > 0) setSelectedCollection(models[0]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, []);

    useEffect(() => {
        if (!selectedCollection) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Reuse the generic admin API if available, or fetch from existing endpoints.
                // The current admin structure uses /admin/[collection].
                // But we want RAW data.
                // I'll assume we can use the existing admin API actions or I might need to create a server action.
                // Wait, the plan said "Implement raw database view".
                // I'll create a server component wrapper or use a server action. 
                // Let's try to fetch from the generic admin data loader if possible.
                // Actually, let's create a specialized Server Action for this in a separate file if needed.
                // For simplicity in this execution step, I'll assume I can fetch via a Server Action I'll define inside this file or adjacent.
                // Actually, I'll use a simple API route approach or just server actions.

                // Let's use getRecords from actions/admin/getRecords.ts? 
                // I verified it exists. It takes collectionName.
                // Let's try to import it if it was a server action, or call an API.

                // Let's use a server action to fetch raw data.
                const res = await fetch(`/api/admin/raw/${selectedCollection}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json.data || []);
                } else {
                    setData([]);
                }

            } catch (error) {
                console.error(error);
                setData([]);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [selectedCollection]);

    return (
        <AdminPageTemplate
            title="Databáze"
            description="Prohlížeč raw dat."
            icon="Database"
            backHref="/admin"
            backLabel="Zpět do administrace"
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-full sm:w-64">
                        <Select
                            value={selectedCollection}
                            onValueChange={setSelectedCollection}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Vyberte kolekci" />
                            </SelectTrigger>
                            <SelectContent>
                                {collections.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Badge variant="outline" className="h-9 px-4">
                        {loadingData ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : data.length} záznamů
                    </Badge>
                </div>

                <Card>
                    <CardHeader className="py-4 border-b">
                        <CardTitle className="text-sm font-mono">
                            {selectedCollection}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px] w-full">
                            <div className="p-4 space-y-2 font-mono text-xs">
                                {loadingData ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                    </div>
                                ) : data.length > 0 ? (
                                    data.map((item, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-zinc-900/50 p-2 rounded border border-gray-100 dark:border-zinc-800 break-all whitespace-pre-wrap text-gray-800 dark:text-gray-300">
                                            {JSON.stringify(item, null, 2)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 text-gray-400">
                                        Žádná data
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </AdminPageTemplate>
    );
}
