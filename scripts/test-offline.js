#!/usr/bin/env node

/**
 * Test script to verify offline caching functionality
 * Run with: node scripts/test-offline.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Offline Caching Setup...\n');

// Check if service worker file exists
const swPath = path.join(process.cwd(), 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  console.log('✅ Service worker file exists at /public/sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');
  if (swContent.includes('gps-tracking-sync')) {
    console.log('✅ GPS tracking sync configured in service worker');
  } else {
    console.log('⚠️  GPS tracking sync not found in service worker');
  }
} else {
  console.log('❌ Service worker file not found at /public/sw.js');
}

// Check if offline page exists
const offlinePagePath = path.join(process.cwd(), 'app', 'offline', 'page.tsx');
if (fs.existsSync(offlinePagePath)) {
  console.log('✅ Offline page exists at /app/offline/page.tsx');
} else {
  console.log('❌ Offline page not found at /app/offline/page.tsx');
}

// Check if offline map page exists
const offlineMapPagePath = path.join(process.cwd(), 'app', 'offline-map', 'page.tsx');
if (fs.existsSync(offlineMapPagePath)) {
  console.log('✅ Offline map page exists at /app/offline-map/page.tsx');
} else {
  console.log('❌ Offline map page not found at /app/offline-map/page.tsx');
}

// Check if GPS page has offline functionality
const gpsPagePath = path.join(process.cwd(), 'app', 'soutez', 'gps', 'page.tsx');
if (fs.existsSync(gpsPagePath)) {
  console.log('✅ GPS page exists at /app/soutez/gps/page.tsx');
  const gpsContent = fs.readFileSync(gpsPagePath, 'utf8');
  if (gpsContent.includes('offlineMode')) {
    console.log('✅ GPS page has offline mode detection');
  } else {
    console.log('⚠️  GPS page missing offline mode detection');
  }
  if (gpsContent.includes('serviceWorker')) {
    console.log('✅ GPS page has service worker registration');
  } else {
    console.log('⚠️  GPS page missing service worker registration');
  }
} else {
  console.log('❌ GPS page not found at /app/soutez/gps/page.tsx');
}

// Check Next.js config
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ Next.js config exists');
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  if (configContent.includes('withSerwist')) {
    console.log('✅ Serwist configured in Next.js config');
  } else {
    console.log('⚠️  Serwist not configured in Next.js config');
  }
} else {
  console.log('❌ Next.js config not found');
}

// Check package.json for required dependencies
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (dependencies['@serwist/next']) {
    console.log('✅ @serwist/next dependency found');
  } else {
    console.log('❌ @serwist/next dependency missing');
  }
  
  if (dependencies['@serwist/sw']) {
    console.log('✅ @serwist/sw dependency found');
  } else {
    console.log('❌ @serwist/sw dependency missing');
  }
} else {
  console.log('❌ package.json not found');
}

console.log('\n📋 Offline Caching Test Summary:');
console.log('================================');
console.log('1. Service Worker: Should be generated during build');
console.log('2. GPS Page: Should work offline with cached resources');
console.log('3. Offline Pages: Should show when no connection');
console.log('4. Map Tiles: Should be cached for offline viewing');
console.log('5. GPS Data: Should sync when connection restored');
console.log('\n🚀 To test offline functionality:');
console.log('1. Build the project: npm run build');
console.log('2. Start the production server: npm start');
console.log('3. Visit the GPS page and let it cache');
console.log('4. Disconnect from internet');
console.log('5. Refresh the page - it should work offline');
console.log('6. Reconnect and check if data syncs'); 