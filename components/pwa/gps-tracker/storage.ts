import { OfflineData } from './types';

// Simplified: Only gets last known location from IndexedDB
export const getStoredLocation = (): void => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  
  try {
    const openRequest = indexedDB.open('gpsTrackerDB', 1);

    openRequest.onupgradeneeded = function(event) {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' });
      }
      // Ensure 'offlineTracks' store exists if needed elsewhere, SW manages its own potentially.
      if (!db.objectStoreNames.contains('offlineTracks')) {
         db.createObjectStore('offlineTracks', { keyPath: 'timestamp' });
       }
    };

    openRequest.onerror = function(event) {
       console.error('Error opening IndexedDB:', (event.target as IDBOpenDBRequest).error);
    };
    
    openRequest.onsuccess = function(event) {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('locations')) {
        console.warn(`'locations' store not found in IndexedDB.`);
        if (typeof window !== 'undefined') {
             window.dispatchEvent(new CustomEvent('indexeddb-location-not-found'));
           }
        return; 
      }

      try {
        const transaction = db.transaction(['locations'], 'readonly');
        const locationStore = transaction.objectStore('locations');
        const locationRequest = locationStore.get('lastKnown');
        
        locationRequest.onsuccess = function() {
          if (locationRequest.result) {
            const { lat, lng } = locationRequest.result;
            if (typeof window !== 'undefined') {
              console.log('Dispatching indexeddb-location-found:', [lat, lng]);
              window.dispatchEvent(new CustomEvent('indexeddb-location-found', { 
                detail: { location: [lat, lng] }
              }));
            }
          } else {
             // Dispatch event indicating location not found
             if (typeof window !== 'undefined') {
                 window.dispatchEvent(new CustomEvent('indexeddb-location-not-found'));
             }
          }
        };

        locationRequest.onerror = function(event) {
          console.error('Error reading from locations store:', (event.target as IDBRequest).error);
          // Dispatch event indicating location not found
          if (typeof window !== 'undefined') {
             window.dispatchEvent(new CustomEvent('indexeddb-location-not-found'));
           }
        };

      } catch (e) {
        console.error('Error creating transaction or reading from IndexedDB:', e);
         // Dispatch event indicating location not found
         if (typeof window !== 'undefined') {
             window.dispatchEvent(new CustomEvent('indexeddb-location-not-found'));
         }
      }
    };
  } catch (e) {
    console.error('Error initiating IndexedDB open request:', e);
  }
};

export const saveLocationForOffline = (locationData: [number, number]): void => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  
  try {
    // We still use postMessage for potential SW interception if needed, but primary storage is direct IndexedDB
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
       navigator.serviceWorker.controller.postMessage({
         type: 'SAVE_LAST_LOCATION', // More specific type
         data: {
           lat: locationData[0],
           lng: locationData[1],
           timestamp: Date.now()
         }
       });
    }

    const openRequest = indexedDB.open('gpsTrackerDB', 1); 
    // onupgradeneeded handled in getStoredLocation or SW
    openRequest.onerror = (event) => {
       console.error('DB open error in saveLocationForOffline:', (event.target as IDBOpenDBRequest).error);
    };
    openRequest.onsuccess = (event) => {
      try {
         const db = (event.target as IDBOpenDBRequest).result;
         if (!db.objectStoreNames.contains('locations')) {
             console.error(`Cannot save location: 'locations' store does not exist.`);
             return;
         }
         const transaction = db.transaction(['locations'], 'readwrite');
         const store = transaction.objectStore('locations');
         store.put({
           id: 'lastKnown',
           lat: locationData[0],
           lng: locationData[1],
           timestamp: Date.now()
         });
       } catch (err) {
          console.error('Error storing location directly in IndexedDB:', err);
       }
    };
  } catch (err) {
    console.error('Error initiating IndexedDB open for saveLocationForOffline:', err);
  }
};

// Sends data to the Service Worker for storage
export const storeDataForOfflineSync = (data: OfflineData): void => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'STORE_OFFLINE_TRACK',
      data: data
    });
    console.log('Sent track data to service worker for offline storage.');
  } else {
    console.warn('Cannot store offline track data: Service worker not active.');
    // Maybe implement a fallback to store temporarily in component state?
  }
}; 