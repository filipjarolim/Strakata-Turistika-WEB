"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cloud, Database, HardDrive, Loader2 } from "lucide-react";

interface UsageData {
    usage: number;
    limit?: number;
    used_percent?: number;
    credits_usage?: number;
}

interface CloudinaryStats {
    plan: string;
    transformations: UsageData;
    objects: UsageData;
    bandwidth: UsageData;
    storage: UsageData;
    credits: UsageData;
}

export function CloudinaryStatsWidget() {
    const [stats, setStats] = useState<CloudinaryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch("/api/admin/cloudinary-stats")
            .then((res) => {
                if (!res.ok) throw new Error("Failed");
                return res.json();
            })
            .then((data) => setStats(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed bg-gray-50 dark:bg-zinc-900/50">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed bg-red-50 dark:bg-red-900/10 text-red-500 text-sm">
                Nepodařilo se načíst statistiky Cloudinary.
            </div>
        );
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getPercent = (item: UsageData | undefined, creditsLimit: number = 0) => {
        if (!item) return 0;
        if (item.used_percent) return item.used_percent;
        if (item.credits_usage && creditsLimit > 0) return (item.credits_usage / creditsLimit) * 100;
        return 0;
    };

    const renderLimit = (item: UsageData | undefined, label: string) => {
        if (!item) return null;
        if (item.limit) {
            return `z ${label === "objekty" ? item.limit.toLocaleString() : formatBytes(item.limit)}`;
        }
        if (item.credits_usage) {
            return `(${item.credits_usage.toFixed(2)} kreditů)`;
        }
        return null; // Unlimited or unknown
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-200/50 dark:border-white/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Kredity</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.credits?.usage?.toFixed(2) ?? 0}</div>
                    <p className="text-xs text-muted-foreground mb-3">
                        z {stats.credits?.limit ?? 0} ({stats.credits?.used_percent?.toFixed(1) ?? 0}%)
                    </p>
                    <Progress value={stats.credits?.used_percent || 0} className="h-1.5" />
                </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-200/50 dark:border-white/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Úložiště</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatBytes(stats.storage?.usage || 0)}</div>
                    <p className="text-xs text-muted-foreground mb-3">
                        {renderLimit(stats.storage, "bytes")} ({getPercent(stats.storage, stats.credits?.limit).toFixed(2)}%)
                    </p>
                    <Progress value={getPercent(stats.storage, stats.credits?.limit)} className="h-1.5" />
                </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-200/50 dark:border-white/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bandwidth</CardTitle>
                    <Cloud className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatBytes(stats.bandwidth?.usage || 0)}</div>
                    <p className="text-xs text-muted-foreground mb-3">
                        {renderLimit(stats.bandwidth, "bytes")} ({getPercent(stats.bandwidth, stats.credits?.limit).toFixed(2)}%)
                    </p>
                    <Progress value={getPercent(stats.bandwidth, stats.credits?.limit)} className="h-1.5" />
                </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-gray-200/50 dark:border-white/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Objekty</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(stats.objects?.usage || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mb-3">
                        {stats.objects?.limit ? `z ${stats.objects.limit.toLocaleString()}` : 'Celkem'}
                    </p>
                    {/* Objects usually don't have a specific percentage in free plan unless via credits, but objects don't show credits_usage in sample */}
                </CardContent>
            </Card>
        </div>
    );
}
