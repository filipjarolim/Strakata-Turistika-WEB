"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PartyPopper } from "lucide-react";
import Link from "next/link"; // Icon for fun feedback

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<PromptResponseObject>;
}

interface PromptResponseObject {
    outcome: "accepted" | "dismissed";
    platform: string;
}

declare global {
    interface Window {
        MSStream?: unknown;
    }
}

const InstallButton: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const { toast } = useToast(); // ShadCN toast hook

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            const event = e as BeforeInstallPromptEvent;
            event.preventDefault();
            setDeferredPrompt(event);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);

        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & typeof globalThis).MSStream);
        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === "accepted") {
            console.log("PWA installed successfully");
            // Trigger toast
            toast({
                title: "App Installed Successfully!", // String title
                description: (
                    <div className="flex items-center gap-2">
                        <PartyPopper className="h-4 w-4 text-green-500" />
                        <span>The app has been added to your home screen.</span>
                    </div>
                ), // JSX allowed here in description
            });
        } else {
            console.log("PWA installation rejected");
        }

        setDeferredPrompt(null);
    };

    if (isStandalone) return null; // No installation option if already standalone

    return (
        <div className="flex flex-col items-start justify-start gap-2 p-4 rounded-lg">
            <Button
                variant="default"
                className="rounded-full"
                onClick={handleInstallClick}
            >
                Instalovat aplikaci
            </Button>
            {isIOS && (
                <p className="text-[8px] text-gray-600">
                    To install this app on your iOS device, tap the share button and then
                    &#34;Add to Home Screen&#34;.
                </p>
            )}
        </div>
    );
};

export default InstallButton;