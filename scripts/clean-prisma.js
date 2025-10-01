#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');

// Files to remove that cause WASM issues
const filesToRemove = [
  'wasm.js',
  'wasm.d.ts',
  'wasm-edge-light-loader.mjs',
  'wasm-worker-loader.mjs'
];

function removeFiles() {
  filesToRemove.forEach(file => {
    const filePath = path.join(prismaClientPath, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Removed ${file}`);
      } catch (error) {
        console.error(`✗ Failed to remove ${file}:`, error.message);
      }
    }
  });
}

// Also remove WASM references from the generated files
function cleanGeneratedFiles() {
  const filesToClean = ['default.js', 'index.js', 'package.json'];
  
  filesToClean.forEach(file => {
    const filePath = path.join(prismaClientPath, file);
    if (fs.existsSync(filePath)) {
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (file === 'package.json') {
          // Remove WASM exports from package.json
          const packageJson = JSON.parse(content);
          
          // Remove WASM exports
          if (packageJson.exports) {
            delete packageJson.exports['./wasm'];
            // Remove WASM references from other exports
            Object.keys(packageJson.exports).forEach(key => {
              if (typeof packageJson.exports[key] === 'object') {
                // Handle nested objects (like require/import)
                if (packageJson.exports[key].require) {
                  if (packageJson.exports[key].require === './wasm.js') {
                    packageJson.exports[key].require = './index.js';
                  } else if (typeof packageJson.exports[key].require === 'object') {
                    Object.keys(packageJson.exports[key].require).forEach(subKey => {
                      if (packageJson.exports[key].require[subKey] === './wasm.js') {
                        packageJson.exports[key].require[subKey] = './index.js';
                      }
                    });
                  }
                }
                if (packageJson.exports[key].import) {
                  if (packageJson.exports[key].import === './wasm.js') {
                    packageJson.exports[key].import = './index.js';
                  } else if (typeof packageJson.exports[key].import === 'object') {
                    Object.keys(packageJson.exports[key].import).forEach(subKey => {
                      if (packageJson.exports[key].import[subKey] === './wasm.js') {
                        packageJson.exports[key].import[subKey] = './index.js';
                      }
                    });
                  }
                }
                if (packageJson.exports[key].default === './wasm.js') {
                  packageJson.exports[key].default = './index.js';
                }
              }
            });
          }
          
          content = JSON.stringify(packageJson, null, 2);
        } else {
          // Remove WASM imports and references from JS files
          content = content.replace(/require\(['"]\.\/wasm\.js['"]\)/g, 'null');
          content = content.replace(/import\(['"]\.\/wasm\.js['"]\)/g, 'Promise.resolve(null)');
          content = content.replace(/\.\/wasm\.js/g, 'null');
          content = content.replace(/wasm-engine/g, 'binary-engine');
        }
        
        fs.writeFileSync(filePath, content);
        console.log(`✓ Cleaned ${file}`);
      } catch (error) {
        console.error(`✗ Failed to clean ${file}:`, error.message);
      }
    }
  });
}

// Run the cleanup
console.log('🧹 Cleaning Prisma WASM files...');
removeFiles();
cleanGeneratedFiles();
console.log('✅ Prisma cleanup complete!');

export { removeFiles, cleanGeneratedFiles };
