# Offline Caching for GPS Tracking

This document explains the offline caching implementation for the GPS tracking functionality in the Strakataturistika application.

## Overview

The application now supports full offline functionality for GPS tracking, ensuring that users can continue tracking their routes even when they lose internet connectivity. All GPS data is stored locally and will sync automatically when the connection is restored.

## Features

### ✅ Offline GPS Tracking
- GPS tracking continues to work without internet connection
- All tracking data is stored locally in the browser
- Automatic sync when connection is restored
- Background sync support for reliable data transmission

### ✅ Offline Page Caching
- GPS page is cached for offline access
- Offline fallback pages for better user experience
- Service worker handles all caching strategies

### ✅ Map Tile Caching
- Map tiles are cached for offline viewing
- Fallback to offline map page when tiles can't be loaded
- Efficient cache management with expiration

### ✅ Background Sync
- GPS tracking data syncs in the background
- Queue system for failed sync attempts
- Automatic retry with exponential backoff

## Architecture

### Service Worker (`app/sw.ts`)
The service worker handles all offline functionality:

```typescript
// GPS page specific caching
const gpsPageCache = new NetworkFirst({
  cacheName: 'gps-page-cache',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    }),
  ],
});

// GPS tracking data cache
const gpsTrackingCache = new NetworkFirst({
  cacheName: 'gps-tracking-cache',
  plugins: [
    new ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60, // 24 hours
    }),
  ],
});
```

### Caching Strategies

1. **GPS Page**: Network First with fallback to cache
2. **Map Tiles**: Cache First with network update
3. **API Routes**: Network First with cache fallback
4. **Static Assets**: Cache First for performance
5. **GPS Tracking Data**: Network First with background sync

### Storage Keys

```typescript
export const STORAGE_KEYS = {
  currentSession: 'currentTrackingSession',
  completedSessions: 'completedSessions',
  offlineQueue: 'offlineSyncQueue',
  settings: 'gpsTrackerSettings',
  lastSync: 'lastSyncTimestamp'
};
```

## Implementation Details

### GPS Page Offline Detection

The GPS page automatically detects offline status and adjusts functionality:

```typescript
const [offlineMode, setOfflineMode] = useState(false);

useEffect(() => {
  const updateOnlineStatus = () => {
    const online = navigator.onLine;
    setIsOnline(online);
    setOfflineMode(!online);
    
    if (online) {
      toast.success('Connection restored');
      syncOfflineData().catch(console.error);
    } else {
      toast.info('Working in offline mode', {
        description: 'GPS tracking will continue to work offline'
      });
    }
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}, []);
```

### Background Tracking

GPS tracking continues in the background even when the app is minimized:

```typescript
export const initBackgroundTracking = (
  onResumeTracking: (session: EnhancedTrackingSession) => void,
  onPositionUpdate?: (position: GPSPosition) => void
): void => {
  // Initialize background tracking
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Register background sync
      if ('sync' in registration) {
        registration.sync.register('gps-tracking-sync');
      }
    });
  }
};
```

### Data Persistence

All GPS data is stored locally using multiple strategies:

1. **localStorage**: For current session and settings
2. **IndexedDB**: For larger datasets and offline queue
3. **Cache API**: For static resources and map tiles

## Testing Offline Functionality

### Manual Testing

1. **Build and Start**:
   ```bash
   npm run build
   npm start
   ```

2. **Cache the GPS Page**:
   - Visit `/soutez/gps`
   - Let the page load completely
   - Check browser dev tools → Application → Service Workers

3. **Test Offline Mode**:
   - Disconnect from internet
   - Refresh the GPS page
   - Verify it loads from cache
   - Start GPS tracking
   - Verify tracking works offline

4. **Test Sync**:
   - Reconnect to internet
   - Check if data syncs automatically
   - Verify no data loss

### Automated Testing

Run the offline test script:

```bash
node scripts/test-offline.js
```

This will verify:
- Service worker configuration
- Offline page existence
- GPS page offline functionality
- Required dependencies

## Configuration

### Next.js Configuration

The `next.config.ts` file includes Serwist configuration:

```typescript
export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  fallback: "/offline",
  cacheId: "strakataturistika-v1",
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  sourcemap: true,
  mode: "production",
})(nextConfig);
```

### Service Worker Configuration

The service worker is configured with:

- **Precaching**: Critical resources cached on install
- **Runtime Caching**: Dynamic resources cached on demand
- **Background Sync**: GPS data syncs when connection restored
- **Fallbacks**: Offline pages for better UX

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**:
   - Check browser console for errors
   - Verify HTTPS in production
   - Check service worker scope

2. **GPS Data Not Syncing**:
   - Check background sync permissions
   - Verify API endpoints are accessible
   - Check offline queue in dev tools

3. **Map Tiles Not Loading Offline**:
   - Verify map tiles are cached
   - Check cache storage limits
   - Clear cache and retry

### Debug Commands

```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});

// Check cache contents
caches.keys().then(keys => {
  console.log('Cache Names:', keys);
});

// Check offline storage
console.log('localStorage:', localStorage.getItem('currentTrackingSession'));
```

## Performance Considerations

### Cache Management

- **Expiration**: Caches expire automatically to prevent storage bloat
- **Size Limits**: Maximum entries per cache to control memory usage
- **Cleanup**: Outdated caches are cleaned up automatically

### Storage Limits

- **localStorage**: ~5-10MB per domain
- **IndexedDB**: ~50MB+ per domain
- **Cache API**: Varies by browser, typically 50MB+

### Optimization

- **Compression**: Static assets are compressed
- **Lazy Loading**: Non-critical resources loaded on demand
- **Background Processing**: Heavy operations run in background

## Browser Support

### Required Features

- Service Workers
- Cache API
- IndexedDB
- Background Sync (optional)
- Geolocation API

### Supported Browsers

- Chrome 40+
- Firefox 44+
- Safari 11.1+
- Edge 17+

### Fallbacks

- GPS tracking works without background sync
- Offline storage falls back to localStorage
- Map tiles show fallback when unavailable

## Security Considerations

### Data Privacy

- GPS data is stored locally only
- No data transmitted without user consent
- Encryption for sensitive data (if implemented)

### Permissions

- Geolocation permission required
- Background sync permission (optional)
- Storage permission (automatic)

## Future Enhancements

### Planned Features

1. **Offline Route Planning**: Plan routes without internet
2. **Offline Maps**: Download map regions for offline use
3. **Data Export**: Export tracking data in various formats
4. **Cloud Sync**: Sync across multiple devices
5. **Advanced Analytics**: Offline analytics and insights

### Performance Improvements

1. **Compression**: Compress stored GPS data
2. **Deduplication**: Remove duplicate GPS points
3. **Smart Caching**: Predictive caching based on usage
4. **Background Processing**: Process data in web workers

## Support

For issues or questions about offline functionality:

1. Check the troubleshooting section
2. Review browser console for errors
3. Test with different browsers
4. Verify network conditions
5. Check service worker status

The offline caching system is designed to be robust and user-friendly, ensuring that GPS tracking works reliably regardless of network conditions. 