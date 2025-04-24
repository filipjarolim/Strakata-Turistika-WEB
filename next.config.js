import withSerwist from '@serwist/next';

const serwistConfig = withSerwist({
  swSrc: 'service-worker/app-worker.ts',
  swDest: 'public/sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add other Next.js config options here
};

export default serwistConfig(nextConfig); 