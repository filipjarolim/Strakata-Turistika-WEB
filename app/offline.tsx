// app/offline.tsx
'use client';
import { useEffect, useState } from 'react';

export default function Offline() {
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useEffect(() => {
        // Get last cache update time from localStorage
        const lastUpdate = localStorage.getItem('lastCacheUpdate');
        if (lastUpdate) {
            setLastUpdated(new Date(lastUpdate).toLocaleString());
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
                <div className="text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                        />
                    </svg>
                    <h1 className="mt-4 text-2xl font-bold text-gray-900">
                        You are Offline
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Please check your internet connection and try again.
                    </p>
                    {lastUpdated && (
                        <p className="mt-4 text-sm text-gray-500">
                            Last cached: {lastUpdated}
                        </p>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}