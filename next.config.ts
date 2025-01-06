import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'offlineCache',
                networkTimeoutSeconds: 15,
                expiration: {
                    maxEntries: 150,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 1 month
                },
                cacheableResponse: {
                    statuses: [0, 200],
                },
            },
        },
    ],
})

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
