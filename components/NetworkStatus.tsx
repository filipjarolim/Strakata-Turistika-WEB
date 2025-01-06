'use client';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEffect, useState } from 'react';

export function NetworkStatus() {
    const isOnline = useNetworkStatus();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className={`fixed bottom-4 right-4 p-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg transition-all duration-300`}>
            {isOnline ? 'Online' : 'Offline'}
        </div>
    );
}
