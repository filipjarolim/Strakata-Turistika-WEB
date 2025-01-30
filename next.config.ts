// next.config.js (CommonJS)
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
            domains: ["cdn.discordapp.com", "lh3.googleusercontent.com"],
        }
    };

    if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
        // Dynamically import the ESM module
        const { default: withSerwist } = await import("@serwist/next");

        return withSerwist({
            swSrc: "src/service-worker/app-worker.ts",
            swDest: "public/sw.js",
            reloadOnOnline: true,
        })(nextConfig);
    }

    return nextConfig;
};
