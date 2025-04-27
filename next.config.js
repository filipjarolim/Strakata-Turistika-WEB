import withSerwist from '@serwist/next';

const serwistConfig = withSerwist({
  swSrc: 'service-worker/app-worker.ts',
  swDest: 'public/sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'ovhahxzjnqazjhdcgmqc.supabase.co',
        pathname: '/storage/v1/object/public/images/**',
      },
    ],
  },
  // Add other Next.js config options here
};

export default serwistConfig(nextConfig); 