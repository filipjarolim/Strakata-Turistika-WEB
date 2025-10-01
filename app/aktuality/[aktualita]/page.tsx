"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Pencil, Calendar, Clock, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { RichTextEditor } from "@/components/ui/ios/rich-text-editor";
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

type NewsItem = {
    id: string;
    title: string;
    content?: string;
    createdAt: Date | string;
    images?: ImageSource[];
};

export default function NewsDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const user = useCurrentUser();
    const role = useCurrentRole();
    const isEditMode = searchParams.get("edit") === "true";
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [images, setImages] = useState<ImageSource[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchNewsItem = useCallback(async () => {
        try {
            const response = await fetch(`/api/news/${params.aktualita}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch news item');
            }
            const data = await response.json();
            
            // Handle new API response format
            if (data.success && data.data) {
                setNewsItem(data.data);
            } else {
                // Fallback for old format
                setNewsItem(data);
            }
        } catch (err) {
            console.error('Error fetching news item:', err);
            setError(err instanceof Error ? err.message : 'Failed to load news item');
        } finally {
            setIsLoading(false);
        }
    }, [params.aktualita]);

    useEffect(() => {
        if (mounted) {
            fetchNewsItem();
        }
    }, [params.aktualita, fetchNewsItem, mounted]);

    useEffect(() => {
        if (isEditMode && newsItem) {
            setTitle(newsItem.title || "");
            setContent(newsItem.content || "");
            setImages((newsItem.images || []).map(img => ({ 
                url: img.url || "", 
                public_id: img.public_id || img.url || "",
                title: img.title
            })));
        }
    }, [isEditMode, newsItem]);

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

    async function handleSubmit() {
        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/news/${params.aktualita}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, images }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update news item');
            }

            await fetchNewsItem();
            router.push(`/aktuality/${params.aktualita}`);
            toast.success("Aktualita byla upravena");
        } catch (error) {
            console.error('Error updating news item:', error);
            if (error instanceof Error) {
                if (error.message.includes('Unauthorized')) {
                    toast.error('Nemáte oprávnění k této akci');
                } else if (error.message.includes('Validation failed')) {
                    toast.error('Chyba ve formuláři: ' + error.message);
                } else {
                    toast.error(error.message || 'Něco se pokazilo');
                }
            } else {
                toast.error('Něco se pokazilo');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const formatDate = (date: Date | string | undefined) => {
        if (!mounted || !date) return '';
        try {
            return format(new Date(date), "d. MMMM yyyy", { locale: cs });
        } catch (error) {
            return '';
        }
    };

    const formatTime = (date: Date | string | undefined) => {
        if (!mounted || !date) return '';
        try {
            return format(new Date(date), "HH:mm", { locale: cs });
        } catch (error) {
            return '';
        }
    };

    if (!mounted) {
        return (
            <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
                <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
                    <div className="flex items-center justify-center h-64">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            <span className="text-gray-500">Načítání...</span>
                        </div>
                    </div>
                </div>
            </CommonPageTemplate>
        );
    }

    return (
        <CommonPageTemplate 
            contents={{header: true}} 
            headerMode="auto-hide"
            currentUser={user}
            currentRole={role}
        >
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                        <IOSCircleIcon variant="blue" size="lg" className="shadow-lg">
                            <Newspaper className="w-8 h-8" />
                        </IOSCircleIcon>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                                {newsItem ? newsItem.title : 'Aktualita'}
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                {newsItem ? formatDate(newsItem.createdAt) : 'Načítání...'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => router.push("/aktuality")}
                            className="flex items-center gap-2 flex-1 sm:flex-none"
                            size="sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Zpět</span>
                            <span className="sm:hidden">Zpět</span>
                        </Button>
                        
                        {role === "ADMIN" && newsItem && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/aktuality/${params.aktualita}?edit=true`)}
                                className="flex items-center gap-2 flex-1 sm:flex-none"
                                size="sm"
                            >
                                <Pencil className="h-4 w-4" />
                                <span className="hidden sm:inline">Upravit</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                <span className="text-gray-500">Načítání...</span>
                            </div>
                        </div>
                    ) : newsItem ? (
                        isEditMode ? (
                            <div className="bg-white border rounded-lg shadow-sm p-6">
                                <h1 className="text-xl sm:text-2xl font-bold mb-6">Upravit aktualitu</h1>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Název
                                        </label>
                                        <input
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="Zadejte název aktuality"
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
                                
                                <div className="flex justify-end gap-3 mt-8">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/aktuality/${params.aktualita}`)}
                                    >
                                        Zrušit
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Ukládám..." : "Uložit"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Main Image */}
                                {newsItem.images && newsItem.images.length > 0 && (
                                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                        <Image
                                            src={newsItem.images[0].url}
                                            alt={newsItem.images[0].title || newsItem.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                {/* Article Content */}
                                <div className="bg-white border rounded-lg shadow-sm p-6">
                                    <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(newsItem.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatTime(newsItem.createdAt)}</span>
                                        </div>
                                    </div>

                                    <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
                                        {newsItem.content ? (
                                            <div 
                                                dangerouslySetInnerHTML={{ 
                                                    __html: newsItem.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                                                }} 
                                            />
                                        ) : (
                                            <p className="text-gray-500 italic">Žádný obsah</p>
                                        )}
                                    </div>
                                </div>

                                {/* Additional Images */}
                                {newsItem.images && newsItem.images.length > 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {newsItem.images.slice(1).map((img, idx) => (
                                            <div key={idx} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                <Image
                                                    src={img.url}
                                                    alt={img.title || `Obrázek ${idx + 2}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <Calendar className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aktualita nebyla nalezena</h3>
                            <p className="text-gray-500">Požadovaná aktualita neexistuje nebo byla smazána.</p>
                        </div>
                    )}
                </div>
            </div>
        </CommonPageTemplate>
    );
}