/**
 * Custom wrapper for next-offline that doesn't use exportPathMap
 */
const withCustomOffline = (nextConfig: any) => {
    // Import next-offline but remove its exportPathMap functionality
    const withOffline = require('next-offline');
    const offlineConfig = withOffline(nextConfig);
    
    // Remove the exportPathMap that's causing issues with App Router
    delete offlineConfig.exportPathMap;
    
    return offlineConfig;
};

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    images: {
        domains: ["cdn.discordapp.com", "lh3.googleusercontent.com", "images.unsplash.com"],
    },
    // Service worker strategies
    workboxOpts: {
        swDest: 'public/sw.js',
        // Add paths that should be available offline
        skipWaiting: true,
        clientsClaim: true,
        offlineGoogleAnalytics: false,
        // Add offline-page fallback
        offlinePage: '/offline',
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'google-fonts',
                    expiration: {
                        maxEntries: 30,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                },
            },
            {
                urlPattern: /^https:\/\/(tile\.openstreetmap\.org|server\.arcgisonline\.com|tile\.opentopomap\.org).*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'map-tiles',
                    expiration: {
                        maxEntries: 500,
                        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                    },
                    cacheableResponse: {
                        statuses: [0, 200],
                    },
                },
            },
            {
                urlPattern: /^https?.*/,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'offlineCache',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 24 * 60 * 60, // 1 day
                    },
                    networkTimeoutSeconds: 10,
                },
            },
            {
                urlPattern: /\/_next\/static\/.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'next-static',
                    expiration: {
                        maxEntries: 200,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /\/_next\/image\?.*/i,
                handler: 'CacheFirst',
                options: {
                    cacheName: 'next-image',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /\/api\/.*/i,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'api-cache',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 60, // 1 hour
                    },
                    networkTimeoutSeconds: 5,
                },
            },
            {
                urlPattern: /.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-font-assets',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-image-assets',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /.(?:js)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-js-assets',
                    expiration: {
                        maxEntries: 100,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
            {
                urlPattern: /.(?:css|less)$/i,
                handler: 'StaleWhileRevalidate',
                options: {
                    cacheName: 'static-style-assets',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                    },
                },
            },
        ],
    },
    // Add development service worker
    dontAutoRegisterSw: false, // Auto-register the service worker
    devSwSrc: './public/dev-sw.js', // Use this service worker in development
    generateInDevMode: false, // Don't generate the production service worker in development
};

module.exports = withCustomOffline(nextConfig);