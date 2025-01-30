"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Loader2, Check, XCircle } from "lucide-react";

// Possible statuses for the service worker
type ServiceWorkerStatus = "not-supported" | "pending" | "ready";

export default function StatusBlock() {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof window !== "undefined" ? navigator.onLine : true
    );
    const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerStatus>("pending");

    useEffect(() => {
        // Functions to handle online/offline changes
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Check service worker support
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready
                .then(() => {
                    setServiceWorkerStatus("ready");
                })
                .catch(() => {
                    setServiceWorkerStatus("pending");
                });
        } else {
            setServiceWorkerStatus("not-supported");
        }

        // Cleanup
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current network & service worker status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Network Status */}
                <div className="flex items-center space-x-2">
                    <p className="font-medium">Network:</p>
                    {isOnline ? (
                        <Badge variant="outline" className="flex items-center space-x-1">
                            <Wifi className="mr-1 h-4 w-4" />
                            <span>Online</span>
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="flex items-center space-x-1">
                            <WifiOff className="mr-1 h-4 w-4" />
                            <span>Offline</span>
                        </Badge>
                    )}
                </div>

                {/* Service Worker Status */}
                <div className="flex items-center space-x-2">
                    <p className="font-medium">Service Worker:</p>
                    {serviceWorkerStatus === "not-supported" && (
                        <Badge variant="destructive" className="flex items-center space-x-1">
                            <XCircle className="h-4 w-4" />
                            <span>Not Supported</span>
                        </Badge>
                    )}
                    {serviceWorkerStatus === "pending" && (
                        <Badge variant="outline" className="flex items-center space-x-1">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Pending</span>
                        </Badge>
                    )}
                    {serviceWorkerStatus === "ready" && (
                        <Badge variant="outline" className="flex items-center space-x-1">
                            <Check className="h-4 w-4" />
                            <span>Ready</span>
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
