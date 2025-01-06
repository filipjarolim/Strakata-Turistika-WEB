import { NetworkStatus } from '@/components/NetworkStatus';

export default function Home() {
  return (
      <main className="min-h-screen p-24">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Next.js PWA
        </h1>
        {/* Your other content */}
        <NetworkStatus />
      </main>
  );
}