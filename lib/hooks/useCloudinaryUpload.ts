import { useState } from 'react';
import { cloudinary } from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

interface UseCloudinaryUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: 'auto' | 'good' | 'best';
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  folder?: string;
}

export const useCloudinaryUpload = (options: UseCloudinaryUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, title: string): Promise<UploadApiResponse> => {
    setIsUploading(true);
    setError(null);

    try {
      // Convert file to base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64String = buffer.toString('base64');
      const dataURI = `data:${file.type};base64,${base64String}`;

      // Upload to Cloudinary with optimization settings
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload(dataURI, {
          folder: options.folder || 'uploads',
          resource_type: 'auto',
          tags: ['upload', `title:${title}`],
          context: {
            title: title,
            created_at: new Date().toISOString()
          },
          // Optimization settings
          format: options.format || 'auto',
          quality: options.quality || 'auto',
          fetch_format: 'auto',
          transformation: [
            { 
              width: options.maxWidth || 1920, 
              height: options.maxHeight || 1080, 
              crop: 'limit' 
            },
            { quality: options.quality || 'auto:good' },
            { fetch_format: 'auto' }
          ]
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result as UploadApiResponse);
        });
      });

      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (public_id: string): Promise<void> => {
    try {
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(public_id, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
      throw error;
    }
  };

  return {
    upload,
    deleteImage,
    isUploading,
    error
  };
}; 