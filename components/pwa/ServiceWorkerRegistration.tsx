"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { shouldEnableOffline } from '@/lib/dev-utils';

export default function ServiceWorkerRegistration() {
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Disable service worker in development unless offline is enabled
    if (!shouldEnableOffline()) {
      console.log('Service Worker disabled in development mode');
      return;
    }

    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      
      // Add event listeners to handle updates
      wb.addEventListener("installed", (event: CustomEvent<{ isUpdate: boolean }>) => {
        console.log(`Service Worker: ${event.type}`);
        if (!event.detail.isUpdate) {
          toast.success("App ready for offline use", { 
            duration: 3000,
            position: "bottom-right"
          });
        }
      });

      wb.addEventListener("waiting", () => {
        toast.message("New version available", {
          description: "Reload to update",
          action: {
            label: "Reload",
            onClick: () => window.location.reload(),
          },
          duration: 0, // Won't dismiss automatically
          position: "bottom-right"
        });
      });

      wb.addEventListener("controlling", () => {
        window.location.reload();
      });

      // Register the service worker
      wb.register();
      setIsRegistered(true);
    }
  }, []);

  return null; // This component doesn't render anything
} 