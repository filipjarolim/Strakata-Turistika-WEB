import { defaultCache } from "@serwist/next/worker";
import { Serwist, RouteMatchCallbackOptions } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<string>;
};

// Add custom runtime caching configurations
const customCacheConfig = [
  // For external profile images from Google authentication
  {
    matcher: {
      name: "googleusercontent",
      match: ({ url }: RouteMatchCallbackOptions) => 
        url.hostname.includes('googleusercontent.com')
    },
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "external-profile-images",
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      },
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  },
  // Handle Next.js Image optimization requests
  {
    matcher: {
      name: "next-image",
      match: ({ url }: RouteMatchCallbackOptions) => 
        url.pathname.startsWith('/_next/image')
    },
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "next-image",
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      },
    },
  },
  // Default caching for other resources
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCacheConfig,
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners(); 