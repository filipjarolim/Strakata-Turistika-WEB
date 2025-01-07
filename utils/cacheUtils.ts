// utils/cacheUtils.ts
export const updateCache = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('lastCacheUpdate', new Date().toISOString());
    }
};

export const clearCache = async () => {
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    localStorage.removeItem('lastCacheUpdate');
};