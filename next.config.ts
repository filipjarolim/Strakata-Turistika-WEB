import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },
    serverExternalPackages: ['@prisma/client', 'prisma', 'oauth4webapi'],
    transpilePackages: ["next-auth", "@auth/core", "sonner", "@tiptap/core", "@tiptap/react", "@tiptap/starter-kit", "@tiptap/pm"],

    images: {
        remotePatterns: [
            { protocol: "https", hostname: "res.cloudinary.com" },
            { protocol: "https", hostname: "tile.openstreetmap.org" },
            { protocol: "https", hostname: "server.arcgisonline.com" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "play.google.com" },
            { protocol: "https", hostname: "images.unsplash.com" },
        ],
    },

    webpack: (config) => {
        // Suppress Edge Runtime warnings for bcryptjs
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            /bcryptjs/,
            /Edge Runtime/,
        ];

        // Disable webpack cache to avoid "Unable to snapshot resolve dependencies" error
        config.cache = false;

        return config;
    },

    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;