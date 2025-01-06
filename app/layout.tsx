import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
