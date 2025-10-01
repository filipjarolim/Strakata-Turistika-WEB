"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Plus, 
  Download, 
  Info,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  FileImage
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { compressImage, validateImageFile, formatFileSize } from "@/lib/image-compression";
import { motion, AnimatePresence } from "framer-motion";

export interface ImageSource {
  url: string;
  public_id: string;
  title?: string;
  originalSize?: number;
  compressedSize?: number;
  dimensions?: { width: number; height: number };
  uploadedAt?: Date;
}

interface CompressedResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'compressing' | 'completed' | 'error';
  error?: string;
  compressedResult?: CompressedResult;
}

interface EnhancedImageUploadProps {
  sources: ImageSource[];
  onUpload: (file: File, title: string) => Promise<void>;
  onDelete: (public_id: string) => Promise<void>;
  stackingStyle?: "grid" | "list";
  aspectRatio?: "square" | "video" | "landscape";
  showUploadButton?: boolean;
  showDeleteButton?: boolean;
  count?: number;
  className?: string;
  uploadButtonClassName?: string;
  deleteButtonClassName?: string;
  imageContainerClassName?: string;
  placeholderClassName?: string;
}

export const EnhancedImageUpload: React.FC<EnhancedImageUploadProps> = ({
  sources,
  onUpload,
  onDelete,
  stackingStyle = "grid",
  aspectRatio = "square",
  showUploadButton = true,
  showDeleteButton = true,
  count = 4,
  className,
  uploadButtonClassName,
  deleteButtonClassName,
  imageContainerClassName,
  placeholderClassName
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showImageInfo, setShowImageInfo] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processFile = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      file,
      progress: 0,
      status: 'compressing'
    });

    try {
      // Simulate compression progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(prev => prev ? { ...prev, progress: i } : null);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Compress image
      const compressedResult = await compressImage(file);
      
      setUploadProgress(prev => prev ? { 
        ...prev, 
        progress: 50,
        status: 'uploading',
        compressedResult
      } : null);

      // Simulate upload progress
      for (let i = 50; i <= 100; i += 10) {
        setUploadProgress(prev => prev ? { ...prev, progress: i } : null);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await onUpload(compressedResult.file, title || file.name);
      
      setUploadProgress({
        file,
        progress: 100,
        status: 'completed',
        compressedResult
      });

      setTimeout(() => {
        setUploadProgress(null);
        setTitle("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsUploading(false);
      }, 1000);

    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(prev => prev ? { 
        ...prev, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      } : null);
      
      setTimeout(() => {
        setUploadProgress(null);
        setIsUploading(false);
      }, 2000);
    }
  };

  const handleDelete = async (public_id: string) => {
    try {
      await onDelete(public_id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    landscape: "aspect-[16/9]"
  }[aspectRatio];

  const gridClass = stackingStyle === "grid" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4";

  const ImageInfoModal = ({ source }: { source: ImageSource }) => (
    <Dialog open={showImageInfo === source.public_id} onOpenChange={() => setShowImageInfo(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Informace o obrázku</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={source.url}
              alt={source.title || 'Obrázek'}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Název:</span>
              <span className="text-sm font-medium">{source.title || 'Bez názvu'}</span>
            </div>
            {source.originalSize && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Původní velikost:</span>
                <span className="text-sm font-medium">{formatFileSize(source.originalSize)}</span>
              </div>
            )}
            {source.compressedSize && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Komprimovaná velikost:</span>
                <span className="text-sm font-medium">{formatFileSize(source.compressedSize)}</span>
              </div>
            )}
            {source.dimensions && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rozměry:</span>
                <span className="text-sm font-medium">{source.dimensions.width} × {source.dimensions.height}px</span>
              </div>
            )}
            {source.uploadedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nahráno:</span>
                <span className="text-sm font-medium">
                  {new Date(source.uploadedAt).toLocaleDateString('cs-CZ')}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(source.url, source.title || 'obrazek')}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Stáhnout
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImageInfo(null)}
              className="flex-1"
            >
              Zavřít
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(gridClass)}>
        {sources.map((source) => (
          <motion.div
            key={source.public_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "relative group",
              aspectRatioClass,
              imageContainerClassName
            )}
          >
            <AspectRatio ratio={aspectRatio === "square" ? 1 : aspectRatio === "video" ? 16/9 : 16/9}>
              <Image
                src={source.url}
                alt={source.title || 'Obrázek'}
                fill
                className="object-cover rounded-lg"
              />
            </AspectRatio>
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowImageInfo(source.public_id)}
                  title="Informace o obrázku"
                >
                  <Info className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDownload(source.url, source.title || 'obrazek')}
                  title="Stáhnout obrázek"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {showDeleteButton && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(source.public_id)}
                    title="Smazat obrázek"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* File info badge */}
            {source.compressedSize && source.originalSize && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                {Math.round(((source.originalSize - source.compressedSize) / source.originalSize) * 100)}% komprese
              </div>
            )}
          </motion.div>
        ))}

        {/* Upload area */}
        {sources.length < count && showUploadButton && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "relative border-2 border-dashed border-gray-300 rounded-lg",
              "hover:border-blue-500 transition-colors cursor-pointer",
              dragOver && "border-blue-500 bg-blue-50",
              aspectRatioClass,
              placeholderClassName
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="text-center">
                <div className="mb-4">
                  {dragOver ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <FileImage className="w-12 h-12 text-blue-500 mx-auto" />
                    </motion.div>
                  ) : (
                    <Plus className="w-12 h-12 text-gray-400 mx-auto" />
                  )}
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {dragOver ? 'Přetáhněte obrázek sem' : 'Přidat fotku'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  nebo klikněte pro výběr
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  JPEG, PNG, WebP • max 10MB
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-4 bg-gray-50 rounded-lg border"
          >
            <div className="flex items-center gap-3 mb-3">
              {uploadProgress.status === 'compressing' && (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
              {uploadProgress.status === 'uploading' && (
                <Upload className="w-5 h-5 text-blue-500" />
              )}
              {uploadProgress.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {uploadProgress.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {uploadProgress.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {uploadProgress.status === 'compressing' && 'Komprimace...'}
                  {uploadProgress.status === 'uploading' && 'Nahrávání...'}
                  {uploadProgress.status === 'completed' && 'Dokončeno'}
                  {uploadProgress.status === 'error' && uploadProgress.error}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {uploadProgress.progress}%
                </p>
                {uploadProgress.compressedResult && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadProgress.compressedResult.compressedSize)}
                  </p>
                )}
              </div>
            </div>
            
            <Progress value={uploadProgress.progress} className="h-2" />
            
            {uploadProgress.compressedResult && (
              <div className="mt-2 text-xs text-gray-600">
                Komprese: {formatFileSize(uploadProgress.compressedResult.originalSize)} → {formatFileSize(uploadProgress.compressedResult.compressedSize)} 
                ({uploadProgress.compressedResult.compressionRatio}% úspora)
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image info modals */}
      {sources.map((source) => (
        <ImageInfoModal key={source.public_id} source={source} />
      ))}
    </div>
  );
};
