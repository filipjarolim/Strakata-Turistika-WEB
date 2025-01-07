// components/NetworkStatus.tsx
'use client';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEffect, useState } from 'react';
import { updateCache, clearCache } from '@/utils/cacheUtils';

export function NetworkStatus() {
    const isOnline = useNetworkStatus();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOnline) {
            updateCache();
        }
    }, [isOnline]);

    const handleRefresh = async () => {
        if (isOnline) {
            await clearCache();
            window.location.reload();
        }
    };

    if (!mounted) return null;

    return (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
            <div
                className={`
          p-3 rounded-full 
          ${isOnline ? 'bg-green-500' : 'bg-red-500'} 
          text-white shadow-lg transition-all duration-300
          flex items-center gap-2
        `}
            >
        <span className={`
          w-2 h-2 rounded-full 
          ${isOnline ? 'bg-green-200' : 'bg-red-200'}
          animate-pulse
        `}></span>
                {isOnline ? 'Online' : 'Offline'}
            </div>
            {isOnline && (
                <button
                    onClick={handleRefresh}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-full shadow-lg transition-colors"
                >
                    Refresh Cache
                </button>
            )}
        </div>
    );
}