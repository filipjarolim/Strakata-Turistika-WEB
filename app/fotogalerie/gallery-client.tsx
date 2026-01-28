"use client";

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Camera, Images, Search, X, Info, Calendar, MapPin, Filter, Upload, Heart, Share2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { UploadForm } from './upload-form';

// iOS Components
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSDropdownMenu, IOSDropdownMenuItem } from "@/components/ui/ios/dropdown-menu";

export interface Category {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
}

// Categories for tabs with icons and colors
export const CATEGORIES: Category[] = [
    {
        id: "all",
        label: "Vše",
        icon: <Filter className="h-4 w-4" />,
        color: "bg-gray-100 text-gray-800"
    },
    {
        id: "mountains",
        label: "Hory",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg>,
        color: "bg-blue-100 text-blue-800"
    },
    {
        id: "water",
        label: "Voda",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"></path><path d="M15 10h5v8h-5"></path><path d="M4 10h5v8H4"></path><path d="M9 10h5v8H9"></path><path d="M5 2v8"></path><path d="M19 2v8"></path><path d="M12 2v8"></path></svg>,
        color: "bg-cyan-100 text-cyan-800"
    },
    {
        id: "forest",
        label: "Les",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16"></path><path d="M12 2v8"></path><path d="m9 7 3 3 3-3"></path><path d="M13 5a4 4 0 0 1 4 4"></path></svg>,
        color: "bg-green-100 text-green-800"
    },
    {
        id: "winter",
        label: "Zima",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12v9"></path><path d="M12 3v9"></path><path d="m8 7 4-4 4 4"></path><path d="m8 17 4 4 4-4"></path><path d="M3 12h9"></path><path d="M12 12h9"></path><path d="m7 8-4 4 4 4"></path><path d="m17 8 4 4-4 4"></path></svg>,
        color: "bg-slate-100 text-slate-800"
    },
    {
        id: "city",
        label: "Město",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>,
        color: "bg-orange-100 text-orange-800"
    },
];

interface GalleryImage {
    public_id: string;
    url: string;
    title: string;
    description: string;
    location: string;
    category: string;
    created_at: string;
    aspectRatio?: string;
}

export const GalleryClient = ({ initialImages = [] }: { initialImages?: GalleryImage[] }) => {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');

    // Filter images based on search and category

    // Filter images based on search and category
    const filteredImages = images.filter(img => {
        const matchesSearch =
            img.title.toLowerCase().includes(search.toLowerCase()) ||
            img.description.toLowerCase().includes(search.toLowerCase()) ||
            img.location.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === "all" || img.category === category;
        return matchesSearch && matchesCategory;
    });

    // Function to simulate loading when changing categories
    const handleCategoryChange = (value: string) => {
        setLoading(true);
        setCategory(value);
        // Simulate loading delay
        setTimeout(() => setLoading(false), 400);
    };

    // Get aspect ratio class
    const getAspectRatioClass = (aspectRatio: string): string => {
        switch (aspectRatio) {
            case 'portrait': return 'aspect-[3/4]';
            case 'landscape': return 'aspect-[4/3]';
            default: return 'aspect-square';
        }
    };

    const ImageCard = ({ image, index }: { image: GalleryImage; index: number }) => {
        const categoryInfo = CATEGORIES.find(cat => cat.id === image.category);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
            >
                <IOSCard
                    variant="outlined"
                    className="p-0 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
                    onClick={() => setSelectedImage(image)}
                >
                    <div className={cn("relative overflow-hidden", getAspectRatioClass(image.aspectRatio || 'square'))}>
                        <Image
                            src={image.url}
                            alt={image.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <h3 className="font-semibold text-lg mb-1">{image.title}</h3>
                                <p className="text-sm text-white/80 mb-2 line-clamp-2">{image.description}</p>
                                <div className="flex items-center gap-2 text-xs text-white/70">
                                    <MapPin className="h-3 w-3" />
                                    <span>{image.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Category Badge */}
                        {categoryInfo && (
                            <div className="absolute top-3 left-3">
                                <IOSBadge
                                    label={categoryInfo.label}
                                    bgColor={categoryInfo.color.split(' ')[0]}
                                    textColor={categoryInfo.color.split(' ')[1]}
                                    size="sm"
                                    icon={categoryInfo.icon}
                                />
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex gap-2">
                                <IOSButton
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 bg-white/90 backdrop-blur-xl"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Share functionality
                                    }}
                                >
                                    <Share2 className="h-4 w-4" />
                                </IOSButton>
                                <IOSButton
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 bg-white/90 backdrop-blur-xl"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Like functionality
                                    }}
                                >
                                    <Heart className="h-4 w-4" />
                                </IOSButton>
                            </div>
                        </div>
                    </div>
                </IOSCard>
            </motion.div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-center gap-3">
                    <IOSCircleIcon variant="blue" size="lg">
                        <Images className="h-8 w-8" />
                    </IOSCircleIcon>
                </div>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Fotogalerie</h1>
                    <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
                        Prozkoumejte naši sbírku fotografií ze společných výletů s českým strakatým psem po celé republice.
                    </p>
                </div>
            </motion.div>

            {/* Search and Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <IOSCard
                    title="Vyhledávání a filtry"
                    subtitle={`Nalezeno ${filteredImages.length} fotografií`}
                    icon={<Search className="h-6 w-6" />}
                    iconBackground="bg-blue-100"
                    iconColor="text-blue-600"
                >
                    <div className="space-y-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <IOSTextInput
                                placeholder="Hledat fotky..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Kategorie</h4>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => (
                                    <IOSButton
                                        key={cat.id}
                                        variant={category === cat.id ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => handleCategoryChange(cat.id)}
                                        className="gap-2"
                                    >
                                        {cat.icon}
                                        {cat.label}
                                    </IOSButton>
                                ))}
                            </div>
                        </div>

                        {/* View Mode and Upload */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Zobrazení:</span>
                                <IOSButton
                                    variant={viewMode === 'grid' ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                >
                                    Grid
                                </IOSButton>
                                <IOSButton
                                    variant={viewMode === 'masonry' ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setViewMode('masonry')}
                                >
                                    Masonry
                                </IOSButton>
                            </div>
                            <UploadForm />
                        </div>
                    </div>
                </IOSCard>
            </motion.div>

            {/* Gallery Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                {loading ? (
                    // Skeleton loading state
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 rounded-3xl aspect-square"></div>
                                <div className="h-4 bg-gray-200 rounded mt-3 w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded mt-2 w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredImages.length === 0 ? (
                    // Empty state
                    <IOSCard
                        title="Žádné fotky nenalezeny"
                        subtitle={search
                            ? `Nepodařilo se najít žádné fotky odpovídající "${search}"`
                            : "V této kategorii zatím nejsou žádné fotky"}
                        icon={<Images className="h-6 w-6" />}
                        iconBackground="bg-gray-100"
                        iconColor="text-gray-400"
                    >
                        <div className="text-center py-8">
                            <IOSCircleIcon variant="default" size="lg" className="mx-auto mb-4">
                                <Images className="h-8 w-8" />
                            </IOSCircleIcon>
                            {search && (
                                <IOSButton
                                    variant="outline"
                                    onClick={() => setSearch("")}
                                    className="mt-4"
                                >
                                    Vymazat vyhledávání
                                </IOSButton>
                            )}
                        </div>
                    </IOSCard>
                ) : (
                    // Image Grid
                    <div className={cn(
                        "grid gap-6",
                        viewMode === 'grid'
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 space-y-6"
                    )}>
                        {filteredImages.map((image, index) => (
                            <ImageCard key={image.public_id} image={image} index={index} />
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Image Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl dark:border dark:border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <Image
                                    src={selectedImage.url}
                                    alt={selectedImage.title}
                                    width={800}
                                    height={600}
                                    className="w-full h-auto max-h-[70vh] object-contain bg-black/5 dark:bg-black/40"
                                />

                                {/* Close Button */}
                                <IOSButton
                                    size="icon"
                                    variant="outline"
                                    className="absolute top-4 right-4 h-10 w-10 bg-white/90 dark:bg-black/50 backdrop-blur-xl border-white/20 dark:border-white/10 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-black/70"
                                    onClick={() => setSelectedImage(null)}
                                >
                                    <X className="h-5 w-5" />
                                </IOSButton>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{selectedImage.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mb-3">{selectedImage.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                <span>{selectedImage.location}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{new Date(selectedImage.created_at).toLocaleDateString('cs-CZ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <IOSButton variant="outline" size="sm">
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Sdílet
                                        </IOSButton>
                                        <IOSButton variant="outline" size="sm">
                                            <Heart className="h-4 w-4 mr-2" />
                                            Líbí se mi
                                        </IOSButton>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};