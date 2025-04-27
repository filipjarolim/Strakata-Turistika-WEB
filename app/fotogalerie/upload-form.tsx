'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Upload } from "lucide-react";
import { CATEGORIES, Category } from './gallery-client';
import Image from 'next/image';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('date', date);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCategory('');
      setLocation('');
      setDate('');
      setPreviewUrl(null);
      
      // Refresh the page to show new image
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
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
          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Popis
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Popis fotky"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="category" className="text-sm font-medium">
              Kategorie
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Vyberte kategorii" />
              </SelectTrigger>
              <SelectContent position="popper">
                {CATEGORIES.filter((cat: Category) => cat.id !== 'all').map((cat: Category) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label htmlFor="location" className="text-sm font-medium">
              Lokace
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Místo pořízení fotky"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="date" className="text-sm font-medium">
              Datum
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
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