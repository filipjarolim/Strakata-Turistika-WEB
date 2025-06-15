"use client";

import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export interface ImageSource {
  url: string;
  public_id: string;
  title?: string;
}

interface ImageUploadProps {
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

export const ImageUpload: React.FC<ImageUploadProps> = ({
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file, title || file.name);
      setTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (public_id: string) => {
    try {
      await onDelete(public_id);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    landscape: "aspect-[16/9]"
  }[aspectRatio];

  const gridClass = stackingStyle === "grid" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4";

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(gridClass)}>
        {sources.map((source) => (
          <div
            key={source.public_id}
            className={cn(
              "relative group",
              aspectRatioClass,
              imageContainerClassName
            )}
          >
            <Image
              src={source.url}
              alt={source.title || "Uploaded image"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {showDeleteButton && (
              <button
                onClick={() => handleDelete(source.public_id)}
                className={cn(
                  "absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  deleteButtonClassName
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {source.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-sm truncate">{source.title}</p>
              </div>
            )}
          </div>
        ))}

        {sources.length < count && showUploadButton && (
          <div className={cn("relative", aspectRatioClass)}>
            <label
              htmlFor="image-upload"
              className={cn(
                "flex flex-col items-center justify-center w-full h-full cursor-pointer",
                "bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors",
                "border-2 border-dashed border-gray-200 hover:border-blue-500/50 rounded-xl",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                placeholderClassName
              )}
            >
              <div className="flex flex-col items-center justify-center p-6">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-gray-600 font-medium">Přidat fotku</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}; 