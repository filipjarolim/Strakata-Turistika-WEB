"use client";

import * as React from "react";
import { ImageUpload, ImageSource } from "./image-upload";
import { useCloudinaryUpload } from "@/lib/hooks/use-cloudinary-upload";

export function ImageUploadExample() {
  const [images, setImages] = React.useState<ImageSource[]>([]);
  const { upload, deleteImage } = useCloudinaryUpload({
    folder: "example",
    maxWidth: 1920,
    maxHeight: 1080,
    quality: "auto",
    format: "auto",
    competitionId: "example-id",
  });

  const handleUpload = async (file: File, title: string) => {
    const result = await upload(file, title);
    setImages((prev) => [
      ...prev,
      {
        url: result.secure_url,
        public_id: result.public_id,
        title: title,
      },
    ]);
  };

  const handleDelete = async (public_id: string) => {
    await deleteImage(public_id);
    setImages((prev) => prev.filter((img) => img.public_id !== public_id));
  };

  return (
    <div className="space-y-8">
      {/* Grid layout example */}
      <div>
        <h2 className="text-xl font-bold mb-4">Grid Layout</h2>
        <ImageUpload
          sources={images}
          onUpload={handleUpload}
          onDelete={handleDelete}
          stackingStyle="grid"
          aspectRatio="square"
          showUploadButton
          showDeleteButton
        />
      </div>

      {/* Masonry layout example */}
      <div>
        <h2 className="text-xl font-bold mb-4">Masonry Layout</h2>
        <ImageUpload
          sources={images}
          onUpload={handleUpload}
          onDelete={handleDelete}
          stackingStyle="list"
          aspectRatio="landscape"
          showUploadButton={false}
          showDeleteButton
        />
      </div>

      {/* Carousel layout example */}
      <div>
        <h2 className="text-xl font-bold mb-4">Carousel Layout</h2>
        <ImageUpload
          sources={images}
          onUpload={handleUpload}
          onDelete={handleDelete}
          stackingStyle="grid"
          aspectRatio="landscape"
          showUploadButton={false}
          showDeleteButton
        />
      </div>
    </div>
  );
} 