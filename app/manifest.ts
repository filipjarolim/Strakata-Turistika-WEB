import type { MetadataRoute } from 'next';
import basicInfo from "@/lib/settings/basicInfo";

export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "strakataturistika",
        dir: "ltr",
        lang: "cz",
        name: basicInfo.name,
        short_name: basicInfo.name,
        description: basicInfo.description,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        orientation: "portrait", // Locks screen orientation
        categories: ["travel", "navigation", "lifestyle"], // Categorizes the app
        icons: [
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },

        ],
        shortcuts: [
            {
                name: "Plan a New Trip",
                short_name: "New Trip",
                description: "Plan your next adventure quickly.",
                url: "/new-trip",
                icons: [
                    {
                        src: "/icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
            {
                name: "View Saved Places",
                short_name: "Saved Places",
                description: "Access your saved places effortlessly.",
                url: "/saved-places",
                icons: [
                    {
                        src: "/icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
        ],
        screenshots: [
            {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },

        ],
    };
}