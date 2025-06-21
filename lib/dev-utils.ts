/**
 * Development Utilities
 * Helper functions for development environment
 */

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.includes('localhost'));

export const isDevEnvironment = isDevelopment || isLocalhost;

/**
 * Clear all caches in development
 */
export const clearDevCaches = async () => {
  if (!isDevEnvironment) {
    console.warn('Cache clearing only available in development');
    return;
  }

  try {
    // Clear browser caches
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => window.caches.delete(cacheName))
      );
      console.log('Browser caches cleared');
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      console.log('localStorage cleared');
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      console.log('sessionStorage cleared');
    }

    console.log('✅ All development caches cleared');
  } catch (error) {
    console.error('Error clearing caches:', error);
  }
};

/**
 * Disable service worker in development
 */
export const disableServiceWorker = () => {
  if (!isDevEnvironment) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('Service worker unregistered');
      });
    });
  }
};

/**
 * Development mode warning
 */
export const devWarning = (message: string) => {
  if (isDevEnvironment) {
    console.warn(`🚨 Development Warning: ${message}`);
  }
};

/**
 * Development mode info
 */
export const devInfo = (message: string) => {
  if (isDevEnvironment) {
    console.info(`ℹ️ Development Info: ${message}`);
  }
};

// --- OFFLINE MODE TOGGLE HELPERS ---
/**
 * Should enable offline features (service worker, cache) in dev?
 * Checks env variable or localStorage for override
 */
export const shouldEnableOffline = () => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('enable-offline-dev');
    if (local === 'true') return true;
    if (local === 'false') return false;
  }
  return process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_OFFLINE_IN_DEV === 'true';
};

/**
 * Toggle offline mode in development (for browser console)
 */
export const toggleOfflineMode = () => {
  if (typeof window === 'undefined') return;
  const current = localStorage.getItem('enable-offline-dev');
  const newValue = current === 'true' ? 'false' : 'true';
  localStorage.setItem('enable-offline-dev', newValue);
  window.location.reload();
  return newValue === 'true';
};

/**
 * Completely disable offline features in development
 * This should be called early in the app to prevent hydration issues
 */
export const disableOfflineInDev = () => {
  if (!isDevEnvironment) return;
  
  // Force disable offline mode
  if (typeof window !== 'undefined') {
    localStorage.setItem('enable-offline-dev', 'false');
  }
  
  // Unregister service workers
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('🔌 Service worker unregistered for development');
      });
    });
  }
  
  console.log('🚫 Offline features disabled for development');
}; 