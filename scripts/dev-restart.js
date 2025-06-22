#!/usr/bin/env node

/**
 * Development Restart Script
 * Clears all caches and restarts the development server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Restarting development environment...');

// Kill any existing Node processes
try {
  console.log('🛑 Stopping existing processes...');
  execSync('taskkill /f /im node.exe', { stdio: 'ignore' });
} catch (error) {
  // Ignore errors if no processes to kill
}

// Clear Next.js cache
const nextCacheDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('📁 Clearing .next cache...');
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
}

// Clear node_modules/.cache if it exists
const nodeModulesCache = path.join(__dirname, '..', 'node_modules', '.cache');
if (fs.existsSync(nodeModulesCache)) {
  console.log('📁 Clearing node_modules/.cache...');
  fs.rmSync(nodeModulesCache, { recursive: true, force: true });
}

// Clear any other cache directories
const cacheDirs = [
  '.cache',
  'cache',
  'dist',
  'build'
];

cacheDirs.forEach(dir => {
  const cachePath = path.join(__dirname, '..', dir);
  if (fs.existsSync(cachePath)) {
    console.log(`📁 Clearing ${dir}...`);
    fs.rmSync(cachePath, { recursive: true, force: true });
  }
});

console.log('✅ All caches cleared!');
console.log('🚀 Starting development server...');

// Start the development server
try {
  execSync('npm run dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
} 