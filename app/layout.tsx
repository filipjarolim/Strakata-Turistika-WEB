import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from 'react';
import { SessionProvider } from "next-auth/react"
import { auth } from "@/auth"

export const metadata: Metadata = {
    title: 'Strakatá turistika',
    description: 'A Progressive Web App built with Next.js',
    viewport: 'width=device-width, initial-scale=1',
    icons: [
        { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
        { rel: 'icon', url: '/icons/icon-192x192.png', type: 'image/png', sizes: '32x32'}
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
        </body>
        </html>
        </SessionProvider>
    );
}