import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const allRoutes = [
    '/',
    '/about',
    '/contact',
    '/offline',
    '/playground',
    '/vysledky',
    '/vysledky/[rok]',
    // Add all your routes here
];

const precacheEntries: PrecacheEntry[] = allRoutes.map(route => ({ url: route }));

// Transform self.__SW_MANIFEST entries to ensure they are PrecacheEntry objects
const manifestEntries: PrecacheEntry[] = (self.__SW_MANIFEST || []).map(item => (
    typeof item === 'string' ? { url: item } : item
));

const mergedPrecacheEntries: PrecacheEntry[] = [
    ...manifestEntries,
    ...precacheEntries
];

const serwist = new Serwist({
    precacheEntries: mergedPrecacheEntries,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
    fallbacks: {
        entries: [
            {
                url: '/offline',
                matcher({ request }) {
                    return request.destination === 'document';
                },
            },
        ],
    },
});

serwist.addEventListeners();

self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2',
            },
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener('notificationclick', function(event) {
    console.log('Notification click received.');
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return self.clients.openWindow('https://strakataturistika.vercel.app');
        })
    );
});