import { NextResponse } from 'next/server';

export async function GET() {
  // Return a minimal service worker that does nothing in development
  const disabledSW = `
// Service Worker Disabled in Development
// This prevents caching issues during development

self.addEventListener('install', (event) => {
  console.log('Service Worker disabled in development');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker disabled in development');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests in development
  return;
});

// Disable all caching in development
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
  `;

  return new NextResponse(disabledSW, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
} 