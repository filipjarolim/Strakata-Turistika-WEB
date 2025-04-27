"use client";

import React, { useState, useEffect } from 'react';
import { 
    Card, 
    CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Camera, Images, Search, X, Info, Calendar, MapPin, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { UploadForm } from './upload-form';
import { supabase } from '@/lib/supabase';

export interface Category {
    id: string;
    label: string;
    icon: React.ReactNode;
}

// Categories for tabs with icons
export const CATEGORIES: Category[] = [
    { id: "all", label: "Vše", icon: <Filter className="h-4 w-4 mr-1" /> },
    { id: "mountains", label: "Hory", icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="m8 3 4 8 5-5 5 15H2L8 3z"></path></svg> },
    { id: "water", label: "Voda", icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M2 22h20"></path><path d="M15 10h5v8h-5"></path><path d="M4 10h5v8H4"></path><path d="M9 10h5v8H9"></path><path d="M5 2v8"></path><path d="M19 2v8"></path><path d="M12 2v8"></path></svg> },
    { id: "forest", label: "Les", icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M4 20h16"></path><path d="M12 2v8"></path><path d="m9 7 3 3 3-3"></path><path d="M13 5a4 4 0 0 1 4 4"></path></svg> },
    { id: "winter", label: "Zima", icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="M12 12v9"></path><path d="M12 3v9"></path><path d="m8 7 4-4 4 4"></path><path d="m8 17 4 4 4-4"></path><path d="M3 12h9"></path><path d="M12 12h9"></path><path d="m7 8-4 4 4 4"></path><path d="m17 8 4 4-4 4"></path></svg> },
    { id: "city", label: "Město", icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg> },
];

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description: string;
  location: string;
  category: string;
  created_at: string;
  aspectRatio?: string;
}

interface GalleryData {
  images: GalleryImage[];
  total: number;
}

export const GalleryClient = () => {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState<GalleryImage[]>([]);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gallery_images')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setImages(data || []);
        } catch (error) {
            console.error('Error fetching images:', error);
        } finally {
            setLoading(false);
        }
    };

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

    // Get color based on category for visual enhancement
    const getCategoryColor = (category: string): string => {
        switch(category) {
            case 'mountains': return 'bg-blue-100 text-blue-800';
            case 'water': return 'bg-cyan-100 text-cyan-800';
            case 'forest': return 'bg-green-100 text-green-800';
            case 'winter': return 'bg-slate-100 text-slate-800';
            case 'city': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Get aspect ratio class
    const getAspectRatioClass = (aspectRatio: string): string => {
        switch(aspectRatio) {
            case 'portrait': return 'aspect-[3/4]';
            case 'landscape': return 'aspect-[4/3]';
            default: return 'aspect-square';
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Hero section */}
            <div className="relative rounded-xl overflow-hidden mb-8 bg-gray-100">
                <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Fotogalerie</h1>
                    <p className="text-lg md:text-xl max-w-2xl text-gray-600">
                        Prozkoumejte naši sbírku fotografií ze společných výletů s českým strakatým psem po celé republice.
                    </p>
                </div>
            </div>

            {/* Search and filter section */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-4 border-b w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Images className="h-5 w-5 text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Nalezeno {filteredImages.length} fotografií
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Hledat fotky..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 w-full md:w-64 rounded-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                            />
                        </div>
                        <UploadForm />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <Tabs 
                value={category} 
                onValueChange={handleCategoryChange} 
                className="w-full"
            >
                <TabsList className="mb-6 flex w-full overflow-x-auto pb-2 md:flex-wrap p-1 bg-gray-50 rounded-full">
                    {CATEGORIES.map(cat => (
                        <TabsTrigger 
                            key={cat.id} 
                            value={cat.id}
                            className="rounded-full gap-1 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            {cat.icon}
                            {cat.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={category} className="mt-0 min-h-[400px]">
                    {loading ? (
                        // Skeleton loading state
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="bg-gray-200 rounded-lg aspect-square"></div>
                                    <div className="h-4 bg-gray-200 rounded mt-3 w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded mt-2 w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredImages.length === 0 ? (
                        // Empty state
                        <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50">
                            <Images className="h-16 w-16 mb-4 text-gray-300" />
                            <h3 className="text-xl font-medium mb-2">Žádné fotky nenalezeny</h3>
                            <p className="text-muted-foreground max-w-md mb-4">
                                {search 
                                    ? `Nepodařilo se najít žádné fotky odpovídající "${search}"`
                                    : "V této kategorii zatím nejsou žádné fotky"}
                            </p>
                            {search && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => setSearch("")}
                                    className="mt-2"
                                >
                                    Vymazat vyhledávání
                                </Button>
                            )}
                        </div>
                    ) : (
                        // Masonry-like grid layout
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredImages.map(image => (
                                <Card 
                                    key={image.id} 
                                    className="overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-300"
                                    onClick={() => setSelectedImage(image)}
                                >
                                    <CardContent className={cn("p-0 relative", getAspectRatioClass(image.aspectRatio || ''))}>
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">
                                            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col items-center gap-2">
                                                <Button size="sm" className="rounded-full" variant="secondary">
                                                    <Camera className="h-4 w-4 mr-1" />
                                                    Zobrazit detail
                                                </Button>
                                            </div>
                                        </div>
                                        <Image
                                            src={image.url}
                                            alt={image.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={cn("text-xs font-normal", getCategoryColor(image.category))}>
                                                    {CATEGORIES.find(cat => cat.id === image.category)?.label || image.category}
                                                </Badge>
                                            </div>
                                            <h3 className="font-medium">{image.title}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Image detail dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedImage ? `Detail fotky: ${selectedImage.title}` : 'Detail fotky'}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <>
                            <div className="relative aspect-video w-full">
                                <Image
                                    src={selectedImage.url}
                                    alt={selectedImage.title}
                                    fill
                                    className="object-contain rounded-lg"
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedImage.title}</h2>
                                    <p className="text-muted-foreground mt-1">{selectedImage.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {selectedImage.location}
                                    </Badge>
                                    <Badge variant="outline" className="gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {selectedImage.created_at}
                                    </Badge>
                                    <Badge className={cn("gap-1", getCategoryColor(selectedImage.category))}>
                                        {CATEGORIES.find(cat => cat.id === selectedImage.category)?.label || selectedImage.category}
                                    </Badge>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};