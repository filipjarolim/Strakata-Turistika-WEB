// utils/serviceWorker.ts
export function registerServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('ServiceWorker registration successful:', registration);
                })
                .catch((err) => {
                    console.log('ServiceWorker registration failed:', err);
                });
        });
    }
}