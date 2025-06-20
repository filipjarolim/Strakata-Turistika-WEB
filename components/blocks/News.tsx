"use client";

import { useEffect, useState } from "react";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSImageShowcase } from "@/components/ui/ios/image-showcase";
import { ImageUpload, ImageSource } from "@/components/ui/ios/image-upload";
import { IOSTextarea } from "@/components/ui/ios/textarea";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash, Pencil, Plus, Loader2 } from "lucide-react";
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
    createdAt: Date;
    images?: ImageSource[];
};

export default function News() {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [editId, setEditId] = useState<string | null>(null);
    const [images, setImages] = useState<ImageSource[]>([]);
    const role = useCurrentRole();

    useEffect(() => {
        fetchNews().then(() => console.log("News fetched"));
    }, []);

    async function fetchNews(): Promise<void> {
        try {
            setIsLoading(true);
            const res = await fetch("/api/news");
            if (!res.ok) {
                throw new Error(`Error: ${res.status}`);
            }
            const data: NewsItem[] = await res.json();
            setNews(data);
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
                if (response.status === 403) {
                    throw new Error("Unauthorized");
                }
                throw new Error(`Error: ${response.status}`);
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
            if (error instanceof Error && error.message === "Unauthorized") {
                toast.error("Nemáte oprávnění k této akci");
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
                if (response.status === 403) {
                    throw new Error("Unauthorized");
                }
                throw new Error(`Error: ${response.status}`);
            }
            await fetchNews();
            toast.success("Aktualita byla smazána");
        } catch (error) {
            console.error("Error deleting news:", error);
            if (error instanceof Error && error.message === "Unauthorized") {
                toast.error("Nemáte oprávnění k této akci");
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
    const isNew = (createdAt: Date) => {
        const now = new Date();
        const created = new Date(createdAt);
        return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
    };

    return (
        <div className="p-0 md:p-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-8 px-4 md:px-0">
                <h2 className="text-4xl font-bold text-gray-800">Aktuality</h2>
                <AdminRestrictedContent
                    role={role || "UŽIVATEL"}
                    onClick={() => { setOpen(true); setEditId(null); setTitle(""); setContent(""); setImages([]); }}
                    buttonClassName="gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                >
                    <Plus className="w-5 h-5 mr-2" /> Přidat aktualitu
                </AdminRestrictedContent>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {news.map((item) => (
                        <Link
                            key={item.id}
                            href={`/aktuality/${item.id}`}
                            className="group block focus:outline-none"
                            tabIndex={0}
                        >
                            <IOSCard
                                className="relative overflow-visible bg-white/80 rounded-3xl shadow-lg border-0 transition-all duration-300 group-hover:shadow-blue-200/80 group-focus:shadow-blue-200/80 group-hover:shadow-2xl group-focus:shadow-2xl group-hover:-translate-y-1 group-focus:-translate-y-1"
                            >
                                {item.images && item.images.length > 0 && (
                                    <div className="relative mb-4">
                                        <Image
                                            src={item.images[0].url}
                                            alt={item.images[0].title || item.title}
                                            className="rounded-2xl w-full h-40 object-cover shadow-md group-hover:shadow-lg transition-all duration-300"
                                            width={600}
                                            height={160}
                                        />
                                        {isNew(item.createdAt) && (
                                            <span className="absolute top-2 right-2 z-20">
                                                <IOSBadge label="Novinka" size="sm" bgColor="bg-green-100/90" borderColor="border-green-300/80" textColor="text-green-900/90" className="px-3 py-0.5 min-h-0 text-xs" />
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="flex flex-col flex-1 px-2 pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">{item.title}</h3>
                                        <div className="flex gap-2 ml-2 z-10">
                                            <AdminRestrictedContent
                                                role={role || "UŽIVATEL"}
                                                variant="icon"
                                                icon={<IOSCircleIcon variant="blue" size="sm"><Pencil className="w-4 h-4" /></IOSCircleIcon>}
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    setEditId(item.id);
                                                    setTitle(item.title);
                                                    setContent(item.content || "");
                                                    setImages(item.images || []);
                                                    setOpen(true);
                                                }}
                                            />
                                            <AdminRestrictedContent
                                                role={role || "UŽIVATEL"}
                                                variant="icon"
                                                icon={<IOSCircleIcon variant="default" size="sm"><Trash className="w-4 h-4" /></IOSCircleIcon>}
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    handleDelete(item.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <time className="text-xs text-gray-500 mb-1">
                                        {format(new Date(item.createdAt), "d. MMMM yyyy", { locale: cs })}
                                    </time>
                                    <div className="prose prose-sm max-w-none text-gray-600 mb-1 line-clamp-2">
                                        <div dangerouslySetInnerHTML={{ __html: item.content || "" }} />
                                    </div>
                                </div>
                            </IOSCard>
                        </Link>
                    ))}
                </div>
            )}

            {/* Dialog for add/edit news */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {/* Hidden trigger, handled by AdminRestrictedContent */}
                    <span className="hidden" />
                </DialogTrigger>
                <DialogContent className="max-w-lg rounded-3xl bg-white/90 shadow-2xl border-0 p-0 overflow-hidden">
                    <div className="p-8">
                        <DialogTitle className="text-2xl font-bold mb-2">{editId ? "Upravit aktualitu" : "Přidat aktualitu"}</DialogTitle>
                        <DialogDescription className="mb-4">
                            {editId ? "Upravte existující aktualitu." : "Vytvořte novou aktualitu pro uživatele."}
                        </DialogDescription>
                        <div className="space-y-4 mt-2">
                            <Input
                                placeholder="Název aktuality"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="rounded-xl bg-white/60 border-0 shadow-sm focus:ring-2 focus:ring-blue-500/20 text-lg"
                            />
                            <IOSTextarea
                                value={content}
                                onChange={setContent}
                                placeholder="Obsah aktuality"
                                required
                                className="min-h-[160px]"
                            />
                            <div>
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
                        </div>
                        <div className="flex justify-end gap-2 mt-8">
                            <IOSButton
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Zrušit
                            </IOSButton>
                            <IOSButton
                                type="button"
                                loading={isSubmitting}
                                onClick={handleSubmit}
                            >
                                {editId ? "Uložit změny" : "Přidat"}
                            </IOSButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}