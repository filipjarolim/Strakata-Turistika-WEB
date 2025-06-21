import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "res.cloudinary.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "tile.openstreetmap.org",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "server.arcgisonline.com",
                port: "",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                port: "",
                pathname: "/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=0, must-revalidate",
                    },
                ],
            },
            // Disable caching in development
            ...(process.env.NODE_ENV === 'development' ? [
                {
                    source: "/(.*)",
                    headers: [
                        {
                            key: "Cache-Control",
                            value: "no-cache, no-store, must-revalidate",
                        },
                        {
                            key: "Pragma",
                            value: "no-cache",
                        },
                        {
                            key: "Expires",
                            value: "0",
                        },
                    ],
                },
                // Aggressive cache-busting for JS chunks
                {
                    source: "/_next/static/chunks/(.*)",
                    headers: [
                        {
                            key: "Cache-Control",
                            value: "no-cache, no-store, must-revalidate, max-age=0",
                        },
                        {
                            key: "Pragma",
                            value: "no-cache",
                        },
                        {
                            key: "Expires",
                            value: "0",
                        },
                    ],
                },
                {
                    source: "/_next/static/(.*)",
                    headers: [
                        {
                            key: "Cache-Control",
                            value: "no-cache, no-store, must-revalidate, max-age=0",
                        },
                        {
                            key: "Pragma",
                            value: "no-cache",
                        },
                        {
                            key: "Expires",
                            value: "0",
                        },
                    ],
                },
            ] : []),
        ];
    },
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
    // Disable service worker in development
    ...(process.env.NODE_ENV === 'development' && {
        async rewrites() {
            return [
                {
                    source: '/sw.js',
                    destination: '/api/dev-sw-disabled',
                },
            ];
        },
    }),
};

export default nextConfig;