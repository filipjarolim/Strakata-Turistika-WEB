"use client"

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<PromptResponseObject>;
}

interface PromptResponseObject {
    outcome: 'accepted' | 'dismissed';
    platform: string;
}

const InstallButton: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState<boolean>(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            const event = e as BeforeInstallPromptEvent;
            // Prevent the default mini-infobar from appearing
            event.preventDefault();
            // Save the event to trigger it later
            setDeferredPrompt(event);
            // Show the install button
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user's response
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
            console.log('PWA installed successfully');
        } else {
            console.log('PWA installation rejected');
        }

        // Clear the deferredPrompt after use
        setDeferredPrompt(null);
    };

    return (
        <Button variant={"default"} className={"rounded-full"} onClick={handleInstallClick}>
            Nainstalovat jako aplikaci
        </Button>
    );
};

export default InstallButton;