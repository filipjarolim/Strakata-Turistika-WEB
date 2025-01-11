import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { ReactNode } from 'react';
import { SessionProvider } from "next-auth/react"
import { auth } from "@/auth"

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


export default async function RootLayout({ children }: { children: ReactNode }) {
    const session = await auth()

    return (
        <SessionProvider session={session}>
        <html lang="en" suppressHydrationWarning>
        <body>
        {children}
        <ServiceWorkerRegister />
        </body>
        </html>
        </SessionProvider>
    );
}