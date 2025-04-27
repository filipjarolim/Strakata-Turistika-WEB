import { OfflineData } from './types';

// Initialize IndexedDB
const initDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('gpsTrackerDB', 1);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tracks')) {
        db.createObjectStore('tracks', { keyPath: 'timestamp' });
      }
    };
  });
};

export const getStoredLocation = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['locations'], 'readonly');
    const store = transaction.objectStore('locations');
    const request = store.get('lastKnown');

    return new Promise<[number, number] | null>((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve([result.lat, result.lng]);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    console.error('Error getting stored location:', error);
    return null;
  }
};

export const saveLocationForOffline = async (locationData: [number, number]): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['locations'], 'readwrite');
    const store = transaction.objectStore('locations');
    
    store.put({
      id: 'lastKnown',
      lat: locationData[0],
      lng: locationData[1],
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

export const storeDataForOfflineSync = async (data: OfflineData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['tracks'], 'readwrite');
    const store = transaction.objectStore('tracks');
    
    // Store each position separately with its timestamp
    if (data.positions && data.positions.length > 0) {
      data.positions.forEach((pos, index) => {
        store.put({
          timestamp: Number(data.timestamp) + index * 1000,
          position: pos,
          accuracy: data.accuracy,
          speed: data.speed
        });
      });
    }
  } catch (error) {
    console.error('Error storing data for offline sync:', error);
  }
};

export const getStoredPositions = async (): Promise<Array<{ position: [number, number], timestamp: number }>> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['tracks'], 'readonly');
    const store = transaction.objectStore('tracks');
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const positions = request.result || [];
        resolve(positions.sort((a, b) => a.timestamp - b.timestamp));
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error('Error getting stored positions:', error);
    return [];
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