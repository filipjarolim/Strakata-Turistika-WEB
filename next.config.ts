const {
    PHASE_DEVELOPMENT_SERVER,
    PHASE_PRODUCTION_BUILD,
// eslint-disable-next-line @typescript-eslint/no-require-imports
} = require("next/constants");

/**
 * @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>}
 */
module.exports = async (phase: string): Promise<import("next").NextConfig> => {
    /** @type {import("next").NextConfig} */
    const nextConfig = {
        images: {
            domains: ["cdn.discordapp.com", "lh3.googleusercontent.com", "images.unsplash.com"],
        }
    };

    if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
        const { default: withSerwist } = await import("@serwist/next");

        return withSerwist({
            swSrc: "public/service-worker/app-worker.ts",
            swDest: "public/sw.js",
            reloadOnOnline: true,
            swUrl: "/sw.js",
            injectionPoint: 'self.__SW_MANIFEST',
            disable: true,
            additionalPrecacheEntries: [
                { url: '/', revision: Date.now().toString() },
                { url: '/playground', revision: Date.now().toString() },
                { url: '/pravidla', revision: Date.now().toString() },
                { url: '/vysledky', revision: Date.now().toString() },
                { url: '/offline', revision: Date.now().toString() },
                { url: '/login', revision: Date.now().toString() },
                { url: '/profile', revision: Date.now().toString() },
                { url: '/prihlaseni', revision: Date.now().toString() },
                { url: '/icons/icon-192x192.png', revision: Date.now().toString() },
                { url: '/icons/icon-512x512.png', revision: Date.now().toString() },
                { url: '/icons/dog_emoji.png', revision: Date.now().toString() },
                { url: '/manifest.json', revision: Date.now().toString() },
                { url: '/favicon.ico', revision: Date.now().toString() }
            ]
        })(nextConfig);
    }

    return nextConfig;
};