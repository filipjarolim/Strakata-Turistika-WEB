"use client";

import dynamic from 'next/dynamic';

// Dynamically import the service worker registration component
const ServiceWorkerRegistration = dynamic(
  () => import('@/components/pwa/ServiceWorkerRegistration'),
  { ssr: false }
);

export function PwaRegistration() {
  return <ServiceWorkerRegistration />;
} 