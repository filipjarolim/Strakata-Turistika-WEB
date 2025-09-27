import type {Metadata, Viewport} from "next";
import "./globals.css";
import "./sf-pro-fonts.css";
import { ReactNode } from 'react';
import { SessionProvider } from "next-auth/react"
import { auth } from "@/auth"
import basicInfo from "@/lib/settings/basicInfo";
import localFont from "next/font/local";


import { Toaster } from "@/components/ui/toaster"

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"



export const metadata = {
    metadataBase: new URL(defaultUrl),
    title: basicInfo.name,
    description: basicInfo.description,

    category: "website",
    generator: "Next.js", // framework used
    icons: [
        { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png' },
        { rel: 'icon', url: '/icons/icon-192x192.png', type: 'image/png', sizes: '32x32'}
    ],
    openGraph: {
        title: basicInfo.name,
        description: basicInfo.description,
        url: defaultUrl,
        siteName: basicInfo.name,
        locale: 'cs_CZ',
        type: 'website',
    },



}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: '#ffffff',
}


const sfPro = localFont({
  src: "../assets/fonts/SF-Pro.ttf",
  variable: "--font-sf-pro",
  display: "swap",
});

export default async function RootLayout({ children }: { children: ReactNode }) {
    const session = await auth();

    return (
        <html lang="cs" suppressHydrationWarning>
            <body className={`${sfPro.className} ${sfPro.variable}`}>
                <SessionProvider session={session}>
                    {children}
                    <Toaster />
                </SessionProvider>
            </body>
        </html>
    );
}