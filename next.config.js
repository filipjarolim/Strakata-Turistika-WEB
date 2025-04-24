import withSerwist from '@serwist/next';

const serwistConfig = withSerwist({
  swSrc: 'service-worker/app-worker.ts',
  swDest: 'public/sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify as it's deprecated in Next.js 15+
  // Add other Next.js config options here
};

export default serwistConfig(nextConfig); 