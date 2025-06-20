/**
 * Enhanced Background GPS tracking utilities
 * Provides robust offline tracking and background sync capabilities
 */

import { toast } from "@/hooks/use-toast";

declare global {
  interface SyncManager {
    register(tag: string): Promise<void>;
  }
  interface BatteryManager {
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  }
}

// Background tracking configuration
export const BACKGROUND_TRACKING_CONFIG = {
  interval: 5000, // 5 seconds when in background
  highAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  minDistance: 5, // meters
  minAccuracy: 20, // meters
  wakeLockTimeout: 30000, // 30 seconds
  syncInterval: 60000, // 1 minute
  maxOfflineStorage: 100 // max sessions to store offline
};

// Storage keys
export const STORAGE_KEYS = {
  currentSession: 'currentTrackingSession',
  completedSessions: 'completedSessions',
  offlineQueue: 'offlineSyncQueue',
  settings: 'gpsTrackerSettings',
  lastSync: 'lastSyncTimestamp'
};

// Enhanced tracking session interface
export interface EnhancedTrackingSession {
  id: string;
  startTime: number;
  endTime?: number;
  positions: GPSPosition[];
  totalDistance: number;
  totalTime: number;
  averageSpeed: number;
  maxSpeed: number;
  totalAscent: number;
  totalDescent: number;
  isActive: boolean;
  isPaused: boolean;
  lastUpdate: number;
  elapsedTime?: number;
  pauseDuration?: number;
  metadata: {
    deviceInfo: DeviceInfo;
    weatherData?: WeatherData;
    batteryLevel?: number;
    isCharging?: boolean;
    networkType?: string;
  };
  syncStatus: 'pending' | 'synced' | 'failed';
  version: string;
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  connectionType?: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  timestamp: number;
}

export interface TrackingSettings {
  enableHighAccuracy: boolean;
  backgroundTracking: boolean;
  wakeLock: boolean;
  autoSync: boolean;
  minDistance: number;
  minAccuracy: number;
  trackingInterval: number;
  notifications: boolean;
}

// Export BACKGROUND_TRACKING_INTERVAL using the value from BACKGROUND_TRACKING_CONFIG.interval
export const BACKGROUND_TRACKING_INTERVAL = BACKGROUND_TRACKING_CONFIG.interval;

/**
 * Enhanced session storage with offline support
 */
export const storeTrackingSession = (data: Partial<EnhancedTrackingSession>): void => {
  try {
    const existingData = getStoredTrackingSession();
    const updatedData: EnhancedTrackingSession = {
      ...existingData,
      ...data,
      lastUpdate: Date.now(),
      version: '2.0.0'
    };
    
    // Add device info if not present
    if (!updatedData.metadata?.deviceInfo) {
      updatedData.metadata = {
        ...updatedData.metadata,
        deviceInfo: getDeviceInfo()
      };
    }
    
    localStorage.setItem(STORAGE_KEYS.currentSession, JSON.stringify(updatedData));
    
    // Notify service worker
    notifyServiceWorker('TRACKING_UPDATE', updatedData as unknown as Record<string, unknown>);
    
    // Queue for sync if online
    if (navigator.onLine) {
      queueForSync(updatedData as unknown as Record<string, unknown>);
    }
  } catch (e) {
    console.error('Failed to store tracking session:', e);
  }
};

/**
 * Get stored tracking session with fallback
 */
export const getStoredTrackingSession = (): EnhancedTrackingSession => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEYS.currentSession);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      // Migrate old format if needed
      if (!parsed.version) {
        return migrateOldSession(parsed);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to retrieve tracking session:', e);
  }
  
  return createNewSession();
};

/**
 * Create a new tracking session
 */
export const createNewSession = (): EnhancedTrackingSession => {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    positions: [],
    totalDistance: 0,
    totalTime: 0,
    averageSpeed: 0,
    maxSpeed: 0,
    totalAscent: 0,
    totalDescent: 0,
    isActive: false,
    isPaused: false,
    lastUpdate: Date.now(),
    elapsedTime: 0,
    pauseDuration: 0,
    metadata: {
      deviceInfo: getDeviceInfo()
    },
    syncStatus: 'pending',
    version: '2.0.0'
  };
};

/**
 * Clear stored tracking session
 */
export const clearStoredTrackingSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.currentSession);
  notifyServiceWorker('TRACKING_CLEAR', {});
};

/**
 * Get device information
 */
export const getDeviceInfo = (): DeviceInfo => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    connectionType: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType
  };
};

/**
 * Enhanced background tracking initialization
 */
export const initBackgroundTracking = (
  onResumeTracking: (session: EnhancedTrackingSession) => void,
  onPositionUpdate?: (position: GPSPosition) => void
): void => {
  // Listen for visibility changes
  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    
    if (!isHidden) {
      // App came back to foreground
      const storedSession = getStoredTrackingSession();
      
      if (storedSession.isActive && !storedSession.isPaused) {
        onResumeTracking(storedSession);
      }
    }
  });
  
  // Listen for online/offline changes
  window.addEventListener('online', () => {
    console.log('Device came online, syncing data...');
    syncOfflineData();
  });
  
  // Listen for messages from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      handleServiceWorkerMessage(event, onPositionUpdate);
    });
  }
  
  // Initialize wake lock support
  initWakeLock();
  
  // Start periodic sync if supported
  initPeriodicSync();
};

/**
 * Handle service worker messages
 */
const handleServiceWorkerMessage = (
  event: MessageEvent, 
  onPositionUpdate?: (position: GPSPosition) => void
) => {
  if (event.data?.type === 'BACKGROUND_LOCATION_UPDATE') {
    console.log('Received background location update:', event.data);
    
    const storedSession = getStoredTrackingSession();
    if (storedSession.isActive && !storedSession.isPaused && event.data.position) {
      const newPosition: GPSPosition = {
        ...event.data.position,
        timestamp: Date.now()
      };
      
      // Update stored positions
      storeTrackingSession({
        positions: [...storedSession.positions, newPosition]
      });
      
      // Notify callback
      onPositionUpdate?.(newPosition);
    }
  } else if (event.data?.type === 'SYNC_COMPLETED') {
    console.log('Background sync completed:', event.data);
    toast({ title: 'Data synced successfully' });
  } else if (event.data?.type === 'SYNC_FAILED') {
    console.error('Background sync failed:', event.data);
    toast({ title: 'Failed to sync data', variant: 'destructive' });
  }
};

/**
 * Notify service worker
 */
const notifyServiceWorker = (type: string, data: Record<string, unknown>): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type,
      data,
      timestamp: Date.now()
    });
  }
};

/**
 * Queue data for sync
 */
const queueForSync = (data: Record<string, unknown>): void => {
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.offlineQueue) || '[]');
    queue.push({
      ...data,
      queuedAt: Date.now()
    });
    
    // Limit queue size
    if (queue.length > BACKGROUND_TRACKING_CONFIG.maxOfflineStorage) {
      queue.splice(0, queue.length - BACKGROUND_TRACKING_CONFIG.maxOfflineStorage);
    }
    
    localStorage.setItem(STORAGE_KEYS.offlineQueue, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to queue for sync:', e);
  }
};

/**
 * Sync offline data
 */
export const syncOfflineData = async (): Promise<void> => {
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.offlineQueue) || '[]');
    
    if (queue.length === 0) return;
    
    console.log(`Syncing ${queue.length} offline items...`);
    
    // Send to server
    const response = await fetch('/api/saveTrack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessions: queue,
        syncedAt: Date.now()
      })
    });
    
    if (response.ok) {
      // Clear queue on success
      localStorage.removeItem(STORAGE_KEYS.offlineQueue);
      localStorage.setItem(STORAGE_KEYS.lastSync, Date.now().toString());
      console.log('Offline data synced successfully');
    } else {
      throw new Error(`Sync failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Failed to sync offline data:', error);
    throw error;
  }
};

/**
 * Initialize wake lock
 */
export const initWakeLock = (): void => {
  if ('wakeLock' in navigator) {
    console.log('Wake Lock API supported');
  }
};

/**
 * Request wake lock
 */
export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock acquired');
      
      // Auto-release after timeout
      setTimeout(() => {
        wakeLock.release().catch(console.error);
      }, BACKGROUND_TRACKING_CONFIG.wakeLockTimeout);
      
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
export const releaseWakeLock = async (wakeLock: WakeLockSentinel | null): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      console.log('Wake Lock released');
    } catch (err) {
      console.error('Error releasing wake lock:', err);
    }
  }
};

/**
 * Initialize periodic sync
 */
const initPeriodicSync = (): void => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      const sw = registration as ServiceWorkerRegistration & { sync?: SyncManager };
      if (sw.sync) {
        sw.sync.register('gps-tracking-sync')
          .then(() => {
            console.log('Periodic sync registered');
          })
          .catch((err: Error) => {
            console.error('Periodic sync registration failed:', err);
          });
      }
    });
  }
};

/**
 * Migrate old session format
 */
const migrateOldSession = (oldSession: Record<string, unknown>): EnhancedTrackingSession => {
  return {
    id: oldSession.id as string || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: oldSession.startTime as number || Date.now(),
    endTime: oldSession.endTime as number,
    positions: oldSession.positions as GPSPosition[] || [],
    totalDistance: oldSession.totalDistance as number || 0,
    totalTime: oldSession.totalTime as number || 0,
    averageSpeed: oldSession.averageSpeed as number || 0,
    maxSpeed: oldSession.maxSpeed as number || 0,
    totalAscent: oldSession.totalAscent as number || 0,
    totalDescent: oldSession.totalDescent as number || 0,
    isActive: oldSession.isActive as boolean || false,
    isPaused: oldSession.isPaused as boolean || false,
    lastUpdate: oldSession.lastUpdate as number || Date.now(),
    metadata: oldSession.metadata as EnhancedTrackingSession['metadata'] || {
      deviceInfo: getDeviceInfo(),
      weatherData: undefined,
      batteryLevel: undefined,
      isCharging: undefined,
      networkType: undefined
    },
    syncStatus: oldSession.syncStatus as EnhancedTrackingSession['syncStatus'] || 'pending',
    version: oldSession.version as string || '2.0.0'
  };
};

/**
 * Get tracking settings
 */
export const getTrackingSettings = (): TrackingSettings => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.settings);
    return settings ? JSON.parse(settings) : getDefaultSettings();
  } catch (e) {
    console.error('Failed to load settings:', e);
    return getDefaultSettings();
  }
};

/**
 * Save tracking settings
 */
export const saveTrackingSettings = (settings: Partial<TrackingSettings>): void => {
  try {
    const currentSettings = getTrackingSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updatedSettings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

/**
 * Get default settings
 */
const getDefaultSettings = (): TrackingSettings => {
  return {
    enableHighAccuracy: true,
    backgroundTracking: true,
    wakeLock: true,
    autoSync: true,
    minDistance: BACKGROUND_TRACKING_CONFIG.minDistance,
    minAccuracy: BACKGROUND_TRACKING_CONFIG.minAccuracy,
    trackingInterval: BACKGROUND_TRACKING_CONFIG.interval,
    notifications: true
  };
};

/**
 * Calculate distance between two points (Haversine formula)
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Format time duration
 */
export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get battery information
 */
export const getBatteryInfo = async (): Promise<{ level: number; charging: boolean } | null> => {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging
      };
    } catch (e) {
      console.error('Failed to get battery info:', e);
    }
  }
  return null;
}; 