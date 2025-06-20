"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
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
    createdAt: Date;
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
        fetchNewsItem();
    }, [params.aktualita, fetchNewsItem]);

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
        if (!date) return '';
        try {
            return format(new Date(date), "d. MMMM yyyy", { locale: cs });
        } catch (error) {
            return '';
        }
    };

    return (
        <CommonPageTemplate 
            contents={{header: true}} 
            headerMode="auto-hide"
            currentUser={user}
            currentRole={role}
        >
            {/* Full-width image bar */}
            {newsItem && newsItem.images && newsItem.images.length > 0 && (
                <div className="w-full max-w-3xl mx-auto relative">
                    <Image
                        src={newsItem.images[0].url}
                        alt={newsItem.images[0].title || newsItem.title}
                        className="w-full max-h-[340px] object-cover rounded-b-3xl shadow-xl"
                        style={{ objectPosition: 'center' }}
                        width={1200}
                        height={340}
                    />
                    {isNew(newsItem.createdAt) && (
                        <span className="absolute top-4 right-4 z-20">
                            <IOSBadge label="Novinka" size="sm" bgColor="bg-green-100/90" borderColor="border-green-300/80" textColor="text-green-900/90" className="px-3 py-0.5 min-h-0 text-xs" />
                        </span>
                    )}
                    <AdminRestrictedContent
                        role={role || "UŽIVATEL"}
                        variant="icon"
                        icon={<IOSCircleIcon variant="blue" size="md"><Pencil className="w-5 h-5" /></IOSCircleIcon>}
                        onClick={() => router.push(`/aktuality/${params.aktualita}?edit=true`)}
                        buttonClassName="absolute top-4 left-4 z-20 shadow-md"
                    />
                </div>
            )}
            <div className="max-w-2xl mx-auto px-2 md:px-0 py-8 animate-fadeIn">
                <div className="mb-6 flex items-center gap-2">
                    <IOSButton variant="outline" size="default" onClick={() => router.push("/aktuality")}
                        className="rounded-full px-4 py-2 text-blue-600 border-blue-200">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Zpět
                    </IOSButton>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                ) : newsItem ? (
                    isEditMode ? (
                        <IOSCard className="overflow-visible bg-white/80 rounded-3xl shadow-xl border-0 p-0 mt-[-48px]">
                            <div className="px-6 pt-10 pb-2">
                                <h1 className="text-2xl font-bold mb-4 text-gray-900">Upravit aktualitu</h1>
                                <input
                                    className="w-full mb-4 rounded-xl border border-gray-200 px-4 py-2 text-lg"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Název aktuality"
                                />
                                <div className="mb-4">
                                    {/* TODO: Add toolbar prop for bubble menu when IOSTextarea supports it */}
                                    <IOSTextarea
                                        value={content}
                                        onChange={setContent}
                                        placeholder="Obsah aktuality"
                                        required
                                        className="min-h-[160px]"
                                    />
                                </div>
                                <div className="mb-4">
                                    <div className="font-semibold text-blue-900 mb-2">Obrázky</div>
                                    <ImageUpload
                                        sources={images}
                                        onUpload={handleImageUpload}
                                        onDelete={handleImageDelete}
                                        stackingStyle="grid"
                                        aspectRatio="landscape"
                                        count={4}
                                    />
                                </div>
                                <div className="flex gap-2 justify-end mt-6">
                                    <IOSButton variant="outline" onClick={() => router.push(`/aktuality/${params.aktualita}`)}>
                                        Zrušit
                                    </IOSButton>
                                    <IOSButton loading={isSubmitting} onClick={handleSubmit}>
                                        Uložit změny
                                    </IOSButton>
                                </div>
                            </div>
                        </IOSCard>
                    ) : (
                        <IOSCard className="overflow-visible bg-white/80 rounded-3xl shadow-xl border-0 p-0 mt-[-48px]">
                            <div className="px-6 pb-6 pt-10">
                                <h1 className="text-3xl font-bold mb-2 text-gray-900 leading-tight">{newsItem.title}</h1>
                                <time className="text-sm text-gray-500 mb-4 block">
                                    {formatDate(newsItem.createdAt)}
                                </time>
                                <div className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 mb-4">
                                    <div dangerouslySetInnerHTML={{ __html: newsItem.content || "" }} />
                                </div>
                                {newsItem.images && newsItem.images.length > 1 && (
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        {newsItem.images.slice(1).map((img, idx) => (
                                            <Image
                                                key={idx}
                                                src={img.url}
                                                alt={img.title || newsItem.title}
                                                className="rounded-xl w-full h-32 object-cover shadow"
                                                width={400}
                                                height={128}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </IOSCard>
                    )
                ) : null}
            </div>
        </CommonPageTemplate>
    );
}
