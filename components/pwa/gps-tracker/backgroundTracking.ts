/**
 * Enhanced Background GPS tracking utilities
 * Provides robust offline tracking and background sync capabilities
 */

import { toast } from "@/hooks/use-toast";

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string;
  };
}

interface NavigatorWithGetBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>;
}

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

// Enhanced background tracking configuration
export const BACKGROUND_TRACKING_CONFIG = {
  interval: 3000, // 3 seconds when in background (more frequent)
  highAccuracy: true,
  timeout: 15000, // Increased timeout
  maximumAge: 0,
  minDistance: 3, // meters (more sensitive)
  minAccuracy: 30, // meters (more permissive)
  wakeLockTimeout: 60000, // 60 seconds (longer wake lock)
  syncInterval: 30000, // 30 seconds (more frequent sync)
  maxOfflineStorage: 200, // max sessions to store offline
  backgroundInterval: 5000, // 5 seconds when app is in background
  keepAliveInterval: 10000, // 10 seconds keep-alive ping
  maxRetries: 3, // max retries for failed operations
  retryDelay: 5000 // 5 seconds between retries
};

// Storage keys
export const STORAGE_KEYS = {
  currentSession: 'currentTrackingSession',
  completedSessions: 'completedSessions',
  offlineQueue: 'offlineSyncQueue',
  settings: 'gpsTrackerSettings',
  lastSync: 'lastSyncTimestamp',
  backgroundState: 'backgroundTrackingState',
  wakeLockState: 'wakeLockState',
  retryCount: 'retryCount'
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
    backgroundMode?: boolean;
    wakeLockActive?: boolean;
  };
  syncStatus: 'pending' | 'synced' | 'failed';
  version: string;
  backgroundTracking?: boolean;
  lastBackgroundUpdate?: number;
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
  backgroundMode?: boolean;
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
  aggressiveWakeLock: boolean; // New setting for more aggressive wake lock
  backgroundMode: boolean; // New setting for background mode
}

// Background tracking state
interface BackgroundState {
  isActive: boolean;
  lastUpdate: number;
  retryCount: number;
  wakeLockActive: boolean;
  backgroundMode: boolean;
}

// Add at the top:
type OfflineQueueItem = { queuedAt: number; [key: string]: unknown };

/**
 * Enhanced session storage with offline support and background tracking
 */
export const storeTrackingSession = (data: Partial<EnhancedTrackingSession>): void => {
  try {
    const existingData = getStoredTrackingSession();
    const updatedData: EnhancedTrackingSession = {
      ...existingData,
      ...data,
      lastUpdate: Date.now(),
      version: '3.0.0'
    };
    
    // Add device info if not present
    if (!updatedData.metadata?.deviceInfo) {
      updatedData.metadata = {
        ...updatedData.metadata,
        deviceInfo: getDeviceInfo()
      };
    }
    
    // Update background tracking state
    if (data.backgroundTracking !== undefined) {
      updatedData.backgroundTracking = data.backgroundTracking;
      updatedData.lastBackgroundUpdate = Date.now();
    }
    
    localStorage.setItem(STORAGE_KEYS.currentSession, JSON.stringify(updatedData));
    
    // Notify service worker with enhanced data
    notifyServiceWorker('TRACKING_UPDATE', {
      ...updatedData,
      timestamp: Date.now(),
      backgroundMode: document.hidden
    } as unknown as Record<string, unknown>);
    
    // Queue for sync if online
    if (navigator.onLine) {
      queueForSync(updatedData as unknown as Record<string, unknown>);
    }
    
    // Update background state
    updateBackgroundState({
      isActive: updatedData.isActive,
      lastUpdate: Date.now(),
      retryCount: 0,
      wakeLockActive: updatedData.metadata?.wakeLockActive || false,
      backgroundMode: document.hidden
    });
    
  } catch (e) {
    console.error('Failed to store tracking session:', e);
    incrementRetryCount();
  }
};

/**
 * Get stored tracking session with enhanced error handling
 */
export const getStoredTrackingSession = (): EnhancedTrackingSession => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.currentSession);
    if (!stored) {
      return createNewSession();
    }
    
    const session = JSON.parse(stored);
    
    // Migrate old sessions to new format
    if (session.version !== '3.0.0') {
      return migrateOldSession(session);
    }
    
    return session;
  } catch (e) {
    console.error('Failed to get stored session:', e);
    return createNewSession();
  }
};

/**
 * Create new tracking session with enhanced features
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
      deviceInfo: getDeviceInfo(),
      batteryLevel: undefined,
      isCharging: false,
      networkType: (navigator as NavigatorWithConnection).connection?.effectiveType,
      backgroundMode: false,
      wakeLockActive: false
    },
    syncStatus: 'pending',
    version: '3.0.0',
    backgroundTracking: false,
    lastBackgroundUpdate: undefined
  };
};

/**
 * Clear stored tracking session
 */
export const clearStoredTrackingSession = (): void => {
  localStorage.removeItem(STORAGE_KEYS.currentSession);
  localStorage.removeItem(STORAGE_KEYS.backgroundState);
  localStorage.removeItem(STORAGE_KEYS.wakeLockState);
  localStorage.removeItem(STORAGE_KEYS.retryCount);
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
    connectionType: (navigator as NavigatorWithConnection).connection?.effectiveType
  };
};

/**
 * Enhanced background tracking initialization with aggressive wake lock
 */
export const initBackgroundTracking = (
  onResumeTracking: (session: EnhancedTrackingSession) => void,
  onPositionUpdate?: (position: GPSPosition) => void
): void => {
  // Listen for visibility changes with enhanced handling
  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    console.log('Visibility changed:', isHidden ? 'hidden' : 'visible');
    
    if (!isHidden) {
      // App came back to foreground
      const storedSession = getStoredTrackingSession();
      
      if (storedSession.isActive && !storedSession.isPaused) {
        console.log('Resuming tracking from background');
        onResumeTracking(storedSession);
        
        // Request new wake lock when coming back to foreground
        requestWakeLock().then(wakeLock => {
          if (wakeLock) {
            console.log('Wake lock re-acquired after foreground');
          }
        });
      }
    } else {
      // App went to background - enable aggressive background tracking
      console.log('App went to background, enabling aggressive tracking');
      enableAggressiveBackgroundTracking();
    }
  });
  
  // Listen for online/offline changes
  window.addEventListener('online', () => {
    console.log('Device came online, syncing data...');
    syncOfflineData();
  });
  
  // Listen for messages from service worker with enhanced handling
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      handleServiceWorkerMessage(event, onPositionUpdate);
    });
  }
  
  // Initialize enhanced wake lock support
  initWakeLock();
  
  // Start periodic sync if supported
  initPeriodicSync();
  
  // Start keep-alive mechanism
  startKeepAlive();
  
  // Initialize background state
  initBackgroundState();
};

/**
 * Enable aggressive background tracking
 */
const enableAggressiveBackgroundTracking = (): void => {
  const session = getStoredTrackingSession();
  if (session.isActive && !session.isPaused) {
    // Update session with background mode
    storeTrackingSession({
      ...session,
      backgroundTracking: true,
      lastBackgroundUpdate: Date.now(),
      metadata: {
        ...session.metadata,
        backgroundMode: true
      }
    });
    
    // Request aggressive wake lock
    requestAggressiveWakeLock();
    
    // Notify service worker to start background tracking
    notifyServiceWorker('ENABLE_BACKGROUND_TRACKING', {
      sessionId: session.id,
      timestamp: Date.now()
    });
  }
};

/**
 * Initialize background state
 */
const initBackgroundState = (): void => {
  const state: BackgroundState = {
    isActive: false,
    lastUpdate: Date.now(),
    retryCount: 0,
    wakeLockActive: false,
    backgroundMode: false
  };
  
  localStorage.setItem(STORAGE_KEYS.backgroundState, JSON.stringify(state));
};

/**
 * Update background state
 */
const updateBackgroundState = (updates: Partial<BackgroundState>): void => {
  try {
    const currentState = JSON.parse(localStorage.getItem(STORAGE_KEYS.backgroundState) || '{}');
    const newState = { ...currentState, ...updates };
    localStorage.setItem(STORAGE_KEYS.backgroundState, JSON.stringify(newState));
  } catch (e) {
    console.error('Failed to update background state:', e);
  }
};

/**
 * Start keep-alive mechanism
 */
const startKeepAlive = (): void => {
  setInterval(() => {
    const session = getStoredTrackingSession();
    if (session.isActive && !session.isPaused) {
      // Send keep-alive to service worker
      notifyServiceWorker('KEEP_ALIVE', {
        sessionId: session.id,
        timestamp: Date.now()
      });
      
      // Update background state
      updateBackgroundState({
        lastUpdate: Date.now()
      });
    }
  }, BACKGROUND_TRACKING_CONFIG.keepAliveInterval);
};

/**
 * Increment retry count
 */
const incrementRetryCount = (): void => {
  try {
    const count = parseInt(localStorage.getItem(STORAGE_KEYS.retryCount) || '0') + 1;
    localStorage.setItem(STORAGE_KEYS.retryCount, count.toString());
  } catch (e) {
    console.error('Failed to increment retry count:', e);
  }
};

/**
 * Handle service worker messages with enhanced error handling
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
        timestamp: Date.now(),
        backgroundMode: true
      };
      
      // Update stored positions
      storeTrackingSession({
        positions: [...storedSession.positions, newPosition]
      });
      
      // Notify callback
      onPositionUpdate?.(newPosition);
      
      // Reset retry count on successful update
      localStorage.setItem(STORAGE_KEYS.retryCount, '0');
    }
  } else if (event.data?.type === 'SYNC_COMPLETED') {
    console.log('Background sync completed:', event.data);
    toast({ title: 'Data synced successfully' });
  } else if (event.data?.type === 'SYNC_FAILED') {
    console.error('Background sync failed:', event.data);
    toast({ title: 'Failed to sync data', variant: 'destructive' });
    incrementRetryCount();
  } else if (event.data?.type === 'WAKE_LOCK_ACQUIRED') {
    console.log('Wake lock acquired in background');
    updateBackgroundState({ wakeLockActive: true });
  } else if (event.data?.type === 'WAKE_LOCK_RELEASED') {
    console.log('Wake lock released');
    updateBackgroundState({ wakeLockActive: false });
  }
};

/**
 * Notify service worker with enhanced error handling
 */
const notifyServiceWorker = (type: string, data: Record<string, unknown>): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('Failed to notify service worker:', e);
      incrementRetryCount();
    }
  }
};

/**
 * Queue data for sync with enhanced error handling
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
    incrementRetryCount();
  }
};

/**
 * Enhanced sync offline data with retry mechanism
 */
export const syncOfflineData = async (): Promise<void> => {
  try {
    const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.offlineQueue) || '[]');
    const retryCount = parseInt(localStorage.getItem(STORAGE_KEYS.retryCount) || '0');
    
    if (queue.length === 0) {
      console.log('No offline data to sync');
      return;
    }
    
    if (retryCount >= BACKGROUND_TRACKING_CONFIG.maxRetries) {
      console.error('Max retries reached, stopping sync');
      return;
    }
    
    console.log(`Syncing ${queue.length} offline items...`);
    
    for (const item of queue) {
      try {
        // Try to sync each item
        const response = await fetch('/api/gps/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item)
        });
        
        if (response.ok) {
          // Remove successfully synced item
          const updatedQueue = queue.filter((q: OfflineQueueItem) => q.queuedAt !== item.queuedAt);
          localStorage.setItem(STORAGE_KEYS.offlineQueue, JSON.stringify(updatedQueue));
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to sync item:', error);
        incrementRetryCount();
      }
    }
    
    // Reset retry count on successful sync
    localStorage.setItem(STORAGE_KEYS.retryCount, '0');
    localStorage.setItem(STORAGE_KEYS.lastSync, Date.now().toString());
    
  } catch (error) {
    console.error('Background sync failed:', error);
    incrementRetryCount();
  }
};

/**
 * Initialize enhanced wake lock with aggressive mode
 */
export const initWakeLock = (): void => {
  if ('wakeLock' in navigator) {
    console.log('Wake Lock API supported');
    
    // Listen for wake lock release events
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') {
        const session = getStoredTrackingSession();
        if (session.isActive && !session.isPaused) {
          console.log('Re-acquiring wake lock after visibility change');
          await requestWakeLock();
        }
      }
    });
  }
};

/**
 * Request wake lock with enhanced error handling
 */
export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake Lock acquired');
      
      // Store wake lock state
      localStorage.setItem(STORAGE_KEYS.wakeLockState, 'active');
      updateBackgroundState({ wakeLockActive: true });
      
      // Auto-release after timeout
      setTimeout(() => {
        wakeLock.release().catch(console.error);
      }, BACKGROUND_TRACKING_CONFIG.wakeLockTimeout);
      
      return wakeLock;
    } catch (err) {
      console.error('Wake Lock error:', err);
      updateBackgroundState({ wakeLockActive: false });
    }
  }
  return null;
};

/**
 * Request aggressive wake lock for background tracking
 */
export const requestAggressiveWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      console.log('Aggressive Wake Lock acquired for background tracking');
      
      // Store wake lock state
      localStorage.setItem(STORAGE_KEYS.wakeLockState, 'aggressive');
      updateBackgroundState({ wakeLockActive: true });
      
      // Notify service worker
      notifyServiceWorker('WAKE_LOCK_ACQUIRED', {
        type: 'aggressive',
        timestamp: Date.now()
      });
      
      return wakeLock;
    } catch (err) {
      console.error('Aggressive Wake Lock error:', err);
      updateBackgroundState({ wakeLockActive: false });
    }
  }
  return null;
};

/**
 * Release wake lock with enhanced cleanup
 */
export const releaseWakeLock = async (wakeLock: WakeLockSentinel | null): Promise<void> => {
  if (wakeLock) {
    try {
      await wakeLock.release();
      console.log('Wake Lock released');
      
      // Clear wake lock state
      localStorage.removeItem(STORAGE_KEYS.wakeLockState);
      updateBackgroundState({ wakeLockActive: false });
      
      // Notify service worker
      notifyServiceWorker('WAKE_LOCK_RELEASED', {
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('Error releasing wake lock:', err);
    }
  }
};

/**
 * Initialize periodic sync with enhanced registration
 */
const initPeriodicSync = (): void => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      const sw = registration as ServiceWorkerRegistration & { sync?: SyncManager };
      if (sw.sync) {
        // Register multiple sync tags for different purposes
        Promise.all([
          sw.sync.register('gps-tracking-sync'),
          sw.sync.register('gps-background-sync'),
          sw.sync.register('gps-keep-alive-sync')
        ]).then(() => {
          console.log('Enhanced periodic sync registered');
        }).catch((err: Error) => {
          console.error('Enhanced periodic sync registration failed:', err);
        });
      }
    });
  }
};

/**
 * Migrate old session format to new format
 */
const migrateOldSession = (oldSession: Record<string, unknown>): EnhancedTrackingSession => {
  console.log('Migrating old session format');
  const oldMetadata = (typeof oldSession.metadata === 'object' && oldSession.metadata !== null) ? oldSession.metadata as object : {};
  return {
    ...oldSession,
    version: '3.0.0',
    backgroundTracking: false,
    lastBackgroundUpdate: undefined,
    metadata: {
      ...oldMetadata,
      backgroundMode: false,
      wakeLockActive: false
    }
  } as EnhancedTrackingSession;
};

/**
 * Get tracking settings with defaults
 */
export const getTrackingSettings = (): TrackingSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.settings);
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to get tracking settings:', e);
  }
  return getDefaultSettings();
};

/**
 * Save tracking settings
 */
export const saveTrackingSettings = (settings: Partial<TrackingSettings>): void => {
  try {
    const currentSettings = getTrackingSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(newSettings));
  } catch (e) {
    console.error('Failed to save tracking settings:', e);
  }
};

/**
 * Get default settings with enhanced options
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
    notifications: true,
    aggressiveWakeLock: true, // Enable aggressive wake lock by default
    backgroundMode: true // Enable background mode by default
  };
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
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
 * Format time in HH:MM:SS format
 */
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get battery information with enhanced error handling
 */
export const getBatteryInfo = async (): Promise<{ level: number; charging: boolean } | null> => {
  try {
    if ('getBattery' in navigator && typeof (navigator as NavigatorWithGetBattery).getBattery === 'function') {
      const battery = await (navigator as NavigatorWithGetBattery).getBattery?.();
      if (battery) {
        return {
          level: battery.level,
          charging: battery.charging
        };
      }
    }
  } catch (e) {
    console.error('Failed to get battery info:', e);
  }
  return null;
};

// Export constants for use in other modules
export const BACKGROUND_TRACKING_INTERVAL = BACKGROUND_TRACKING_CONFIG.interval; 