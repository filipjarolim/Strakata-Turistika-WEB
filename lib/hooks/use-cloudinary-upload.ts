import { useState } from "react";

interface UseCloudinaryUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: "auto" | "good" | "best";
  format?: "auto" | "webp" | "jpg" | "png";
  folder?: string;
  competitionId: string;
}

export function useCloudinaryUpload(options: UseCloudinaryUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, title: string) => {
    if (!options.competitionId) {
      throw new Error('Competition ID is required');
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('competitionId', options.competitionId);

      const response = await fetch('/api/competition/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Upload failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (public_id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/competition/upload/${public_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Delete failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Delete failed");
      throw error;
    }
  };

  return {
    upload,
    deleteImage,
    isUploading,
    error,
  };
} 