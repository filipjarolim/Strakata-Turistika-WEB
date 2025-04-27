/**
 * Background GPS tracking utilities
 * Helps maintain location tracking even when the app is in the background or the device is locked
 */

// Background tracking interval in ms (when screen is off)
export const BACKGROUND_TRACKING_INTERVAL = 5000;

// Storage key for current tracking session
export const TRACKING_SESSION_KEY = 'currentTrackingSession';

// Interface for stored tracking session data
export interface StoredTrackingSession {
  positions: [number, number][];
  startTime: number | null;
  elapsedTime: number;
  pauseDuration: number;
  lastUpdate: number;
  isActive: boolean;
  isPaused: boolean;
}

/**
 * Store current tracking session in localStorage for recovery
 */
export const storeTrackingSession = (data: Partial<StoredTrackingSession>): void => {
  try {
    // Get existing data first
    const existingData = getStoredTrackingSession();
    const updatedData = {
      ...existingData,
      ...data,
      lastUpdate: Date.now()
    };
    
    localStorage.setItem(TRACKING_SESSION_KEY, JSON.stringify(updatedData));
    
    // Also notify service worker if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRACKING_UPDATE',
        data: updatedData
      });
    }
  } catch (e) {
    console.error('Failed to store tracking session:', e);
  }
};

/**
 * Get stored tracking session from localStorage
 */
export const getStoredTrackingSession = (): StoredTrackingSession => {
  try {
    const storedData = localStorage.getItem(TRACKING_SESSION_KEY);
    if (storedData) {
      return JSON.parse(storedData);
    }
  } catch (e) {
    console.error('Failed to retrieve tracking session:', e);
  }
  
  // Return default empty session if none found
  return {
    positions: [],
    startTime: null,
    elapsedTime: 0,
    pauseDuration: 0,
    lastUpdate: 0,
    isActive: false,
    isPaused: false
  };
};

/**
 * Clear stored tracking session
 */
export const clearStoredTrackingSession = (): void => {
  localStorage.removeItem(TRACKING_SESSION_KEY);
  
  // Notify service worker if available
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'TRACKING_UPDATE',
      data: { isActive: false }
    });
  }
};

/**
 * Initialize background tracking listeners
 */
export const initBackgroundTracking = (
  onResumeTracking: (session: StoredTrackingSession) => void
): void => {
  // Listen for visibility changes
  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    
    if (!isHidden) {
      // App came back to foreground, check if we have updates from background
      const storedSession = getStoredTrackingSession();
      
      if (storedSession.isActive && !storedSession.isPaused) {
        // Tracking is active, notify component to update
        onResumeTracking(storedSession);
      }
    }
  });
  
  // Listen for messages from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'BACKGROUND_LOCATION_UPDATE') {
        // Received location update from service worker
        console.log('Received background location update:', event.data);
        
        const storedSession = getStoredTrackingSession();
        if (storedSession.isActive && !storedSession.isPaused && event.data.position) {
          // Update stored positions with new position from background
          const newPosition: [number, number] = [
            event.data.position.latitude,
            event.data.position.longitude
          ];
          
          storeTrackingSession({
            positions: [...storedSession.positions, newPosition]
          });
        }
      }
    });
  }
};

/**
 * Request wake lock to keep screen on during tracking
 */
export const requestWakeLock = async (): Promise<any> => {
  if ('wakeLock' in navigator) {
    try {
      // @ts-ignore - TypeScript may not recognize WakeLock API yet
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock acquired');
      
      return wakeLock;
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  }
  return null;
};

/**
 * Release wake lock
 */
export const releaseWakeLock = (wakeLock: any): void => {
  if (wakeLock) {
    try {
      wakeLock.release();
      console.log('Wake Lock released');
    } catch (err) {
      console.error('Error releasing Wake Lock:', err);
    }
  }
}; 