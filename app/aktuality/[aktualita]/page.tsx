"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Pencil, Calendar, Clock, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import { AdminRestrictedContent } from "@/components/structure/AdminRestrictedContent";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSTextarea } from "@/components/ui/ios/textarea";
import { ImageUpload, ImageSource } from "@/components/ui/ios/image-upload";
import Image from 'next/image';

type NewsItem = {
    id: string;
    title: string;
    content?: string;
    createdAt: Date | string;
    images?: ImageSource[];
};

// Helper: is news new (last 7 days)?
const isNew = (createdAt: Date | string | undefined) => {
    if (!createdAt) return false;
    const now = new Date();
    const created = new Date(createdAt);
    return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
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
            if (!response.ok) throw new Error('Failed to fetch news item');
            const data = await response.json();
            setNewsItem(data);
        } catch (err) {
            setError('Failed to load news item');
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

            if (!response.ok) throw new Error();

            await fetchNewsItem();
            router.push(`/aktuality/${params.aktualita}`);
            toast.success("Aktualita byla upravena");
        } catch (error) {
            toast.error("Něco se pokazilo");
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

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: newsItem?.title,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Odkaz zkopírován do schránky");
        }
    };

    // Don't render anything until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <CommonPageTemplate 
                contents={{header: true}} 
                headerMode="auto-hide"
                currentUser={user}
                currentRole={role}
            >
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="text-gray-500">Načítání...</span>
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
            <div className="min-h-screen bg-gray-50">
                {/* Hero Image */}
                {newsItem && newsItem.images && newsItem.images.length > 0 && (
                    <div className="relative h-48 sm:h-64 md:h-80 bg-gray-900">
                        <Image
                            src={newsItem.images[0].url}
                            alt={newsItem.images[0].title || newsItem.title}
                            className="w-full h-full object-cover"
                            fill
                            priority
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        
                        {/* Badge and Actions */}
                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                {isNew(newsItem.createdAt) && (
                                    <IOSBadge 
                                        label="Nové" 
                                        size="sm" 
                                        bgColor="bg-green-500" 
                                        textColor="text-white"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <IOSButton
                                    variant="outline"
                                    size="sm"
                                    onClick={handleShare}
                                    className="bg-white/90 backdrop-blur-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                </IOSButton>
                                <AdminRestrictedContent
                                    role={role || "UŽIVATEL"}
                                    variant="icon"
                                    icon={<IOSCircleIcon variant="blue" size="md"><Pencil className="w-4 h-4" /></IOSCircleIcon>}
                                    onClick={() => router.push(`/aktuality/${params.aktualita}?edit=true`)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                    {/* Back Button */}
                    <div className="mb-4 sm:mb-6">
                        <IOSButton 
                            variant="outline" 
                            onClick={() => router.push("/aktuality")}
                            className="gap-2 text-sm sm:text-base"
                            size="sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Zpět na aktuality</span>
                            <span className="sm:hidden">Zpět</span>
                        </IOSButton>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                <span className="text-gray-500">Načítání...</span>
                            </div>
                        </div>
                    ) : newsItem ? (
                        isEditMode ? (
                            <div className="bg-white/95 backdrop-blur-2xl border border-gray-200/30 shadow-xl shadow-black/5 rounded-2xl sm:rounded-3xl overflow-visible transition-all duration-300 ease-out p-4 sm:p-6 md:p-8">
                                <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Upravit aktualitu</h1>
                                
                                <div className="space-y-4 sm:space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Název
                                        </label>
                                        <input
                                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="Zadejte název aktuality"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Obsah
                                        </label>
                                        <IOSTextarea
                                            value={content}
                                            onChange={setContent}
                                            placeholder="Zadejte obsah aktuality..."
                                            className="min-h-[200px] sm:min-h-[300px]"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Obrázky
                                        </label>
                                        <ImageUpload
                                            sources={images}
                                            onUpload={handleImageUpload}
                                            onDelete={handleImageDelete}
                                            stackingStyle="grid"
                                            aspectRatio="landscape"
                                            count={4}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6 sm:mt-8">
                                    <IOSButton 
                                        variant="outline" 
                                        onClick={() => router.push(`/aktuality/${params.aktualita}`)}
                                        className="w-full sm:w-auto"
                                    >
                                        Zrušit
                                    </IOSButton>
                                    <IOSButton 
                                        loading={isSubmitting} 
                                        onClick={handleSubmit}
                                        className="w-full sm:w-auto"
                                    >
                                        Uložit změny
                                    </IOSButton>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/95 backdrop-blur-2xl border border-gray-200/30 shadow-xl shadow-black/5 rounded-2xl sm:rounded-3xl overflow-visible transition-all duration-300 ease-out p-4 sm:p-6 md:p-8">
                                {/* Header */}
                                <div className="mb-6 sm:mb-8">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                                        {newsItem.title}
                                    </h1>
                                    
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{formatDate(newsItem.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatTime(newsItem.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 mb-6 sm:mb-8">
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

                                {/* Additional Images */}
                                {newsItem.images && newsItem.images.length > 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                                        {newsItem.images.slice(1).map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <Image
                                                    src={img.url}
                                                    alt={img.title || newsItem.title}
                                                    className="w-full h-36 sm:h-48 object-cover rounded-xl"
                                                    width={600}
                                                    height={240}
                                                />
                                                {img.title && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 rounded-b-xl">
                                                        <p className="text-white text-sm font-medium">
                                                            {img.title}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="text-center py-8 sm:py-12 px-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Aktualita nebyla nalezena</h2>
                            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Požadovaná aktualita neexistuje nebo byla smazána.</p>
                            <IOSButton onClick={() => router.push("/aktuality")} className="w-full sm:w-auto">
                                Zpět na aktuality
                            </IOSButton>
                        </div>
                    )}
                </div>
            </div>
        </CommonPageTemplate>
    );
}
