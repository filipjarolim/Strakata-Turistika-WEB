import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["lucide-react"],
        turbo: {
            rules: {
                '*.node': {
                    loaders: ['file-loader'],
                    as: '*.js'
                }
            }
        }
    },
    serverExternalPackages: ['@prisma/client', 'prisma'],
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
            {
                protocol: "https",
                hostname: "play.google.com",
                port: "",
                pathname: "/**",
            },

        ],
    },
    async headers() {
        return [

            // Disable caching in development
            ...(process.env.NODE_ENV === 'development' ? [
                {
                    source: "/(.*)",
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
                        {
                            key: "Surrogate-Control",
                            value: "no-store",
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
                        {
                            key: "Surrogate-Control",
                            value: "no-store",
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
                        {
                            key: "Surrogate-Control",
                            value: "no-store",
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
        
        // Ignore Prisma WASM files
        config.resolve.alias = {
            ...config.resolve.alias,
            './query_engine_bg.js': false,
            './query_engine_bg.wasm': false,
            './query_engine_bg.wasm?module': false,
        };
        
        // Ignore WASM files in module resolution
        config.resolve.extensions = config.resolve.extensions || [];
        config.resolve.extensions = config.resolve.extensions.filter((ext: string) => ext !== '.wasm');
        
        // Suppress Edge Runtime warnings for bcryptjs (it's dynamically imported and won't execute in Edge)
        if (config.module) {
            config.module.parser = {
                ...config.module.parser,
                javascript: {
                    ...config.module.parser?.javascript,
                    strictExportPresence: false,
                },
            };
        }
        
        // Ignore warnings about Node.js APIs in Edge Runtime for bcryptjs
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            /bcryptjs/,
            /Edge Runtime/,
        ];
        
        return config;
    },

};

export default nextConfig;