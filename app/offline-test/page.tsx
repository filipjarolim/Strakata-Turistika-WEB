import { OfflineTest } from '@/components/OfflineTest';

export const metadata = {
  title: 'Offline Test | Strakatá turistika',
  description: 'Test offline functionality for the PWA',
};

export default function OfflineTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        PWA & Offline Functionality Test
      </h1>
      
      <OfflineTest />
      
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p>
          This page helps test the service worker and offline capabilities of the PWA.
        </p>
        <p className="mt-2">
          Try toggling your network connection to see how the application behaves offline.
        </p>
      </div>
    </div>
  );
} 