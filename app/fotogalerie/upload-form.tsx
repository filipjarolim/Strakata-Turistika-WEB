'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Upload } from "lucide-react";
import Image from 'next/image';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Please select a photo and enter a title');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || 'Upload failed');
      }

      // Reset form
      setFile(null);
      setTitle('');
      setPreviewUrl(null);
      
      // Refresh the page to show new image
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Camera className="h-4 w-4" />
          Nahrát fotku
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nahrát novou fotku</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="file" className="text-sm font-medium">
              Fotka
            </label>
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            {previewUrl && (
              <div className="mt-2">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Název
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Název fotky"
            />
          </div>
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || !title.trim() || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              'Nahrávání...'
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Nahrát
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}