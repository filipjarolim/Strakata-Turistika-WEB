import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
    title: 'My Next.js PWA',
    description: 'A Progressive Web App built with Next.js',
    manifest: '/manifest.json',
    viewport: 'width=device-width, initial-scale=1',
    icons: [
        { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
        { rel: 'icon', url: '/favicon.ico' },
    ],
    themeColor: '#000000',
}


export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <body>
        {children}
        <ServiceWorkerRegister />
        </body>
        </html>
    );
}