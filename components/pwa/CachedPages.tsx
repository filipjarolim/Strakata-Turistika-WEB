"use client"

import React, { useEffect, useState } from "react";

const CachedPages: React.FC = () => {
    const [pages, setPages] = useState<string[]>([]);

    const fetchCachedPages = async () => {
        try {
            const cache = await caches.open("pages-cache");
            const requests = await cache.keys();
            // Map the Request objects to their URL strings.
            const urls = requests.map((request) => request.url);
            setPages(urls);
        } catch (error) {
            console.error("Error fetching cached pages:", error);
        }
    };

    useEffect(() => {
        fetchCachedPages();
    }, []);

    return (
        <div>
            <h3>Cached Pages</h3>
            <ul>
                {pages.map((url) => (
                    <li key={url}>{url}</li>
                ))}
            </ul>
            <button onClick={fetchCachedPages}>Refresh Cache List</button>
        </div>
    );
};

export default CachedPages;