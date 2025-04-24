import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    name: "Straka Turistika",
    short_name: "StraTur",
    description: "GPS tracking and event management for hiking enthusiasts",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4caf50",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  });
} 