import { OfflineData } from './types';

export const getStoredLocation = () => {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem('lastKnownLocation');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing stored location:', e);
    }
  }
  
  try {
    const openRequest = indexedDB.open('gpsTrackerDB', 1);
    
    openRequest.onsuccess = function() {
      const db = openRequest.result;
      
      try {
        const transaction = db.transaction('locations', 'readonly');
        const store = transaction.objectStore('locations');
        const request = store.get('lastKnown');
        
        request.onsuccess = function() {
          if (request.result) {
            const { lat, lng } = request.result;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('indexeddb-location-found', { 
                detail: { location: [lat, lng] }
              }));
            }
          }
        };
      } catch (e) {
        console.error('Error reading from IndexedDB:', e);
      }
    };
  } catch (e) {
    console.error('Error opening IndexedDB:', e);
  }
  
  return saved ? JSON.parse(saved) : null;
};

export const saveLocationForOffline = (locationData: [number, number]): void => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SAVE_FOR_OFFLINE',
      url: '/lastKnownLocation',
      data: {
        lat: locationData[0],
        lng: locationData[1],
        timestamp: Date.now()
      }
    });
  }
  
  try {
    const openRequest = indexedDB.open('gpsTrackerDB', 1);
    
    openRequest.onupgradeneeded = function() {
      const db = openRequest.result;
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' });
      }
    };
    
    openRequest.onsuccess = function() {
      const db = openRequest.result;
      const transaction = db.transaction('locations', 'readwrite');
      const store = transaction.objectStore('locations');
      
      store.put({
        id: 'lastKnown',
        lat: locationData[0],
        lng: locationData[1],
        timestamp: Date.now()
      });
    };
  } catch (err) {
    console.error('Error storing location in IndexedDB:', err);
  }
};

export const storeDataForOfflineSync = async (data: OfflineData) => {
  try {
    const storedDataStr = localStorage.getItem('offlineGpsData') || '[]';
    const storedData = JSON.parse(storedDataStr);
    
    storedData.push({
      ...data,
      timestamp: Date.now()
    });
    
    localStorage.setItem('offlineGpsData', JSON.stringify(storedData));
    
    if (navigator.onLine) {
      await syncOfflineData();
    }
    
    console.log('Data stored for offline sync');
  } catch (error) {
    console.error('Failed to store data for offline sync:', error);
  }
};

export const syncOfflineData = async () => {
  try {
    const storedData = localStorage.getItem('offlineGpsData');
    
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      
      if (parsedData && parsedData.length > 0) {
        const response = await fetch('/api/sync-gps-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedData),
        });
        
        if (response.ok) {
          localStorage.removeItem('offlineGpsData');
          console.log('Offline data synced successfully');
        }
      }
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
  }
}; 