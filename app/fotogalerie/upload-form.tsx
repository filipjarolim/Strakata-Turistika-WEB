"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from 'next/image';

// iOS Components
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSTextarea } from "@/components/ui/ios/textarea";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSDropdownMenu, IOSDropdownMenuItem } from "@/components/ui/ios/dropdown-menu";

interface UploadFormProps {
    onUploadSuccess?: () => void;
}

export const UploadForm = ({ onUploadSuccess }: UploadFormProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        category: 'mountains'
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = [
        { value: 'mountains', label: 'Hory', icon: '🏔️' },
        { value: 'water', label: 'Voda', icon: '🌊' },
        { value: 'forest', label: 'Les', icon: '🌲' },
        { value: 'winter', label: 'Zima', icon: '❄️' },
        { value: 'city', label: 'Město', icon: '🏙️' }
    ];

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            setFiles(prev => [...prev, ...imageFiles]);
    }
  };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (files.length === 0) return;

        setUploading(true);
        setUploadStatus('idle');
        setUploadProgress(0);

        try {
            const formDataToSend = new FormData();
            
            files.forEach((file, index) => {
                formDataToSend.append('files', file);
            });
            
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('category', formData.category);

            const response = await fetch('/api/gallery/upload', {
        method: 'POST',
                body: formDataToSend,
      });

            if (response.ok) {
                setUploadStatus('success');
                setUploadProgress(100);

      // Reset form
                setFiles([]);
                setFormData({
                    title: '',
                    description: '',
                    location: '',
                    category: 'mountains'
                });
                
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
                
                // Close modal after success
                setTimeout(() => {
                    setIsOpen(false);
                    setUploadStatus('idle');
                    setUploadProgress(0);
                }, 2000);
            } else {
                throw new Error('Upload failed');
            }
    } catch (error) {
      console.error('Upload error:', error);
            setUploadStatus('error');
    } finally {
            setUploading(false);
    }
    };

    const FilePreview = ({ file, index }: { file: File; index: number }) => {
        const [preview, setPreview] = useState<string>('');

        React.useEffect(() => {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }, [file]);

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
            >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    {preview && (
                        <Image
                            src={preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            width={300}
                            height={300}
                        />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <IOSButton
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-white/90 backdrop-blur-xl"
                            onClick={() => removeFile(index)}
                        >
                            <X className="h-4 w-4" />
                        </IOSButton>
                    </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
            </motion.div>
        );
  };

  return (
        <>
            <IOSButton
                onClick={() => setIsOpen(true)}
                className="gap-2"
                icon={<Upload className="h-4 w-4" />}
            >
                Nahrát fotky
            </IOSButton>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => !uploading && setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <IOSCircleIcon variant="blue" size="md">
                                        <Camera className="h-5 w-5" />
                                    </IOSCircleIcon>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Nahrát fotky</h2>
                                        <p className="text-sm text-gray-600">Přidejte nové fotky do galerie</p>
                                    </div>
                                </div>
                                {!uploading && (
                                    <IOSButton
                                        size="icon"
                                        variant="outline"
                                        onClick={() => setIsOpen(false)}
                                        className="h-8 w-8"
                                    >
                                        <X className="h-4 w-4" />
                                    </IOSButton>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* File Upload */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">Fotky</h3>
                                            <span className="text-sm text-gray-500">
                                                {files.length} souborů vybráno
                                            </span>
                                        </div>
                                        
                                        {files.length === 0 ? (
                                            <div
                                                className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <IOSCircleIcon variant="default" size="lg" className="mx-auto mb-4">
                                                    <ImageIcon className="h-8 w-8" />
                                                </IOSCircleIcon>
                                                <p className="text-lg font-medium text-gray-900 mb-2">
                                                    Vyberte fotky
                                                </p>
                                                <p className="text-gray-600 mb-4">
                                                    Přetáhněte sem fotky nebo klikněte pro výběr
                                                </p>
                                                <IOSButton variant="outline" size="sm">
                                                    Vybrat soubory
                                                </IOSButton>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {files.map((file, index) => (
                                                    <FilePreview key={index} file={file} index={index} />
                                                ))}
                                            </div>
                                        )}
                                        
                                        <input
                                            ref={fileInputRef}
              type="file"
                                            multiple
              accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
            />
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <IOSTextInput
                                                label="Název"
                                                placeholder="Název fotky"
                                                value={formData.title}
                                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                required
                />
              </div>
                                        <div>
                                            <IOSTextInput
                                                label="Lokalita"
                                                placeholder="Kde byla fotka pořízena"
                                                value={formData.location}
                                                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                                required
            />
          </div>
            </div>

                                    <div>
                                        <IOSTextarea
                                            value={formData.description}
                                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                            placeholder="Popis fotky..."
                                            required
                                        />
        </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kategorie
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((cat) => (
                                                <IOSButton
                                                    key={cat.value}
                                                    variant={formData.category === cat.value ? "primary" : "outline"}
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
            className="gap-2"
          >
                                                    <span>{cat.icon}</span>
                                                    {cat.label}
                                                </IOSButton>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Upload Progress */}
                                    <AnimatePresence>
                                        {uploading && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-3"
                                            >
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">Nahrávání...</span>
                                                    <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <motion.div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${uploadProgress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Status Messages */}
                                    <AnimatePresence>
                                        {uploadStatus === 'success' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl"
                                            >
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <span className="text-green-800 font-medium">Fotky byly úspěšně nahrány!</span>
                                            </motion.div>
                                        )}
                                        
                                        {uploadStatus === 'error' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl"
                                            >
                                                <AlertCircle className="h-5 w-5 text-red-600" />
                                                <span className="text-red-800 font-medium">Nastala chyba při nahrávání.</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                                {!uploading && (
              <>
                                        <IOSButton
                                            variant="outline"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Zrušit
                                        </IOSButton>
                                        <IOSButton
                                            type="submit"
                                            onClick={handleSubmit}
                                            disabled={files.length === 0 || uploading}
                                            loading={uploading}
                                            icon={!uploading ? <Upload className="h-4 w-4" /> : undefined}
                                        >
                                            {uploading ? 'Nahrávání...' : 'Nahrát fotky'}
                                        </IOSButton>
              </>
            )}
        </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
  );
};