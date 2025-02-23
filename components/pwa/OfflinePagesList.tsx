"use client";

import { useEffect, useState } from "react";

export default function OfflinePagesList() {
    const [cachedPages, setCachedPages] = useState<string[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("message", (event) => {
                if (event.data.type === "UPDATE_CACHED_PAGES") {
                    setCachedPages(event.data.pages);
                }
            });

            navigator.serviceWorker.ready.then((registration) => {
                registration.active?.postMessage({ type: "REQUEST_CACHED_PAGES" });
            });
        }
    }, []);

    return (
        <div className="p-4 border rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Offline Available Pages</h2>
            {cachedPages.length > 0 ? (
                <ul className="list-disc pl-4">
                    {cachedPages.map((page, index) => (
                        <li key={index} className="mb-1">
                            <a href={page} className="text-blue-500 hover:underline">
                                {page}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No pages cached yet. Open pages to store them offline.</p>
            )}
        </div>
    );
}
