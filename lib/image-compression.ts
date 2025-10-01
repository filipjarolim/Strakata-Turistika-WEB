/**
 * Image compression utilities for optimal CDN delivery
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface CompressedImageResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress image to optimal size for CDN
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: `image/${format}`,
            lastModified: Date.now(),
          });

          const compressionRatio = ((file.size - compressedFile.size) / file.size) * 100;

          resolve({
            file: compressedFile,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            compressionRatio: Math.round(compressionRatio),
          });
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get optimal compression settings based on file size
 */
export function getOptimalCompressionSettings(fileSize: number): CompressionOptions {
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return {
      maxWidth: 1600,
      maxHeight: 900,
      quality: 0.8,
      format: 'jpeg'
    };
  } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
      format: 'jpeg'
    };
  } else if (fileSize > 1 * 1024 * 1024) { // > 1MB
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.9,
      format: 'jpeg'
    };
  } else {
    // Small files, minimal compression
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.95,
      format: 'jpeg'
    };
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Soubor je příliš velký. Maximální velikost je ${Math.round(maxSize / (1024 * 1024))}MB.`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Podporované formáty: JPEG, PNG, WebP'
    };
  }

  return { isValid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<CompressedImageResult[]> {
  const results: CompressedImageResult[] = [];
  
  for (const file of files) {
    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const optimalSettings = getOptimalCompressionSettings(file.size);
      const compressedResult = await compressImage(file, { ...optimalSettings, ...options });
      results.push(compressedResult);
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      // Fallback to original file if compression fails
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
      });
    }
  }
  
  return results;
}
