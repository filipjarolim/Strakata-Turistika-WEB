"use client";

import { useEffect, useState } from "react";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSImageShowcase } from "@/components/ui/ios/image-showcase";
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { RichTextEditor } from "@/components/ui/ios/rich-text-editor";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash, Pencil, Plus, Loader2, Calendar, Clock } from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { AdminRestrictedContent } from "../structure/AdminRestrictedContent";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import Image from 'next/image';

type NewsItem = {
    id: string;
    title: string;
    content?: string;
    createdAt: Date | string;
    images?: ImageSource[];
};

export default function News({ showHeader = true, showAddButton = true, standalone = false }: { showHeader?: boolean; showAddButton?: boolean; standalone?: boolean }) {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [editId, setEditId] = useState<string | null>(null);
    const [images, setImages] = useState<ImageSource[]>([]);
    const [mounted, setMounted] = useState(false);
    const role = useCurrentRole();

    useEffect(() => {
        setMounted(true);
        fetchNews();
    }, []);

    async function fetchNews(): Promise<void> {
        try {
            setIsLoading(true);
            const res = await fetch("/api/news");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Error: ${res.status}`);
            }
            const response = await res.json();
            
            // Handle new API response format
            if (response.success && response.data) {
                setNews(response.data);
            } else {
                // Fallback for old format
                setNews(Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            toast.error("Nepodařilo se načíst aktuality");
            setNews([]);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(): Promise<void> {
        try {
            setIsSubmitting(true);
            const method = editId ? "PUT" : "POST";
            const endpoint = editId ? `/api/news/${editId}` : "/api/news";

            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, images }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            await fetchNews();
            setOpen(false);
            setTitle("");
            setContent("");
            setEditId(null);
            setImages([]);
            toast.success(editId ? "Aktualita byla upravena" : "Aktualita byla přidána");
        } catch (error) {
            console.error("Error submitting news:", error);
            if (error instanceof Error) {
                if (error.message.includes("Unauthorized")) {
                    toast.error("Nemáte oprávnění k této akci");
                } else if (error.message.includes("Validation failed")) {
                    toast.error("Chyba ve formuláři: " + error.message);
                } else {
                    toast.error(error.message || "Něco se pokazilo");
                }
            } else {
                toast.error("Něco se pokazilo");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(id: string): Promise<void> {
        try {
            const response = await fetch(`/api/news/${id}`, { method: "DELETE" });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }
            await fetchNews();
            toast.success("Aktualita byla smazána");
        } catch (error) {
            console.error("Error deleting news:", error);
            if (error instanceof Error) {
                if (error.message.includes("Unauthorized")) {
                    toast.error("Nemáte oprávnění k této akci");
                } else {
                    toast.error(error.message || "Něco se pokazilo");
                }
            } else {
                toast.error("Něco se pokazilo");
            }
        }
    }

    // Image upload logic
    const handleImageUpload = async (file: File, title: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setImages((prev) => [...prev, { url: data.url, public_id: data.public_id, title: data.title }]);
    };
    
    const handleImageDelete = async (public_id: string) => {
        setImages((prev) => prev.filter((img) => img.public_id !== public_id));
    };

    // Helper: is news new (last 7 days)?
    const isNew = (createdAt: Date | string) => {
        if (!mounted) return false;
        const now = new Date();
        const created = new Date(createdAt);
        return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
    };

    const formatDate = (date: Date | string) => {
        if (!mounted) return '';
        try {
            return format(new Date(date), "d. MMMM yyyy", { locale: cs });
        } catch (error) {
            return '';
        }
    };

    const formatTime = (date: Date | string) => {
        if (!mounted) return '';
        try {
            return format(new Date(date), "HH:mm", { locale: cs });
        } catch (error) {
            return '';
        }
    };

    // Helper: truncate description
    const truncateDescription = (text: string, maxLength: number = 120) => {
        if (!text) return '';
        const cleanText = text.replace(/<[^>]*>/g, '');
        if (cleanText.length <= maxLength) return cleanText;
        return cleanText.substring(0, maxLength) + '...';
    };

    // Don't render anything until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="text-gray-500">Načítání...</span>
                    </div>
                </div>
            </div>
        );
    }

    // If standalone, render only the news grid (no header/container)
    if (standalone) {
        return (
            isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="text-gray-500">Načítání aktualit...</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <div key={item.id} className="group">
                            <div className="bg-white p-6 rounded-2xl">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl overflow-hidden">
                                        {item.images && item.images.length > 0 ? (
                                            <Image
                                                src={item.images[0].url}
                                                alt={item.images[0].title || item.title}
                                                width={300}
                                                height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                        {isNew(item.createdAt) && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                                                    Nové
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                                    {formatDate(item.createdAt)}
                                                </span>
                                                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                                    {formatTime(item.createdAt)}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold line-clamp-2">
                                                {item.title}
                                            </h3>
                                            {item.content && (
                                                <p className="text-sm text-gray-600 line-clamp-4">
                                                    {truncateDescription(item.content, 150)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/aktuality/${item.id}`}
                                                className="flex-1"
                                            >
                                                <button className="w-full bg-black text-white px-6 py-2 text-sm rounded-lg">
                                                    Číst více
                                                </button>
                                            </Link>
                                            {/* Admin Actions - Next to button, visible on hover */}
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {role === "ADMIN" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e?.preventDefault();
                                                            setEditId(item.id);
                                                            setTitle(item.title);
                                                            setContent(item.content || "");
                                                            setImages(item.images || []);
                                                            setOpen(true);
                                                        }}
                                                        className="bg-black text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                                                        title="Rychlá úprava"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {role === "ADMIN" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e?.preventDefault();
                                                            handleDelete(item.id);
                                                        }}
                                                        className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                                                        title="Smazat aktualitu"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
        );
    }

    // Default: render with header and container
    return (
        <div className="max-w-full mx-auto px-4 py-8">
            {/* Header */}
            {showHeader && (
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Aktuality</h2>
                        <p className="text-gray-600 mt-1">Nejnovější informace a události</p>
                    </div>
                    {showAddButton && (
                        <AdminRestrictedContent
                            role={role || "UŽIVATEL"}
                            onClick={() => { 
                                setOpen(true); 
                                setEditId(null); 
                                setTitle(""); 
                                setContent(""); 
                                setImages([]); 
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Přidat aktualitu
                            </div>
                        </AdminRestrictedContent>
                    )}
                </div>
            )}
            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="text-gray-500">Načítání aktualit...</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <div key={item.id} className="group">
                            <div className="bg-white p-6 rounded-2xl">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-xl overflow-hidden">
                                        {item.images && item.images.length > 0 ? (
                                            <Image
                                                src={item.images[0].url}
                                                alt={item.images[0].title || item.title}
                                                width={300}
                                                height={300}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <Calendar className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                        {isNew(item.createdAt) && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                                                    Nové
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                                    {formatDate(item.createdAt)}
                                                </span>
                                                <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                                    {formatTime(item.createdAt)}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold line-clamp-2">
                                                {item.title}
                                            </h3>
                                            {item.content && (
                                                <p className="text-sm text-gray-600 line-clamp-4">
                                                    {truncateDescription(item.content, 150)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/aktuality/${item.id}`}
                                                className="flex-1"
                                            >
                                                <button className="w-full bg-black text-white px-6 py-2 text-sm rounded-lg">
                                                    Číst více
                                                </button>
                                            </Link>
                                            {/* Admin Actions - Next to button, visible on hover */}
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {role === "ADMIN" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e?.preventDefault();
                                                            setEditId(item.id);
                                                            setTitle(item.title);
                                                            setContent(item.content || "");
                                                            setImages(item.images || []);
                                                            setOpen(true);
                                                        }}
                                                        className="bg-black text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                                                        title="Rychlá úprava"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {role === "ADMIN" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e?.preventDefault();
                                                            handleDelete(item.id);
                                                        }}
                                                        className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                                                        title="Smazat aktualitu"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && news.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <Calendar className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Žádné aktuality</h3>
                    <p className="text-gray-500">Zatím nebyly publikovány žádné aktuality.</p>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogTitle className="text-xl font-semibold">
                        {editId ? "Upravit aktualitu" : "Nová aktualita"}
                    </DialogTitle>
                    <DialogDescription className="mb-6">
                        {editId ? "Upravte existující aktualitu." : "Vytvořte novou aktualitu pro uživatele."}
                    </DialogDescription>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Název
                            </label>
                            <Input
                                placeholder="Zadejte název aktuality"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Obsah
                            </label>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Zadejte obsah aktuality..."
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Obrázky
                            </label>
                            <EnhancedImageUpload
                                sources={images}
                                onUpload={handleImageUpload}
                                onDelete={handleImageDelete}
                                stackingStyle="grid"
                                aspectRatio="landscape"
                                count={4}
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6">
                        <IOSButton
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Zrušit
                        </IOSButton>
                        <IOSButton
                            loading={isSubmitting}
                            onClick={handleSubmit}
                        >
                            {editId ? "Uložit" : "Publikovat"}
                        </IOSButton>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}