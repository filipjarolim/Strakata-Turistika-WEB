import { CacheManager } from '@/components/pwa/CacheManager';

export default async function ProfilePage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="mt-8">
        <CacheManager />
      </div>
    </div>
  );
} 