"use client";

import { useEffect, useState, useCallback } from "react";
import { NewsCard } from "@/components/blocks/NewsCard";
import { NewsFilter } from "@/components/blocks/NewsFilter";
import { IOSButton } from "@/components/ui/ios/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { RichTextEditor } from "@/components/ui/ios/rich-text-editor";
import { Loader2, Plus, AlertCircle, ChevronDown } from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { NewsService, NewsItem } from "@/lib/news-service";

// NewsItem is imported now


interface NewsProps {
    showHeader?: boolean;
    showAddButton?: boolean;
    variant?: "light" | "dark";
    className?: string;
}

export default function News({ showHeader = true, showAddButton = true, variant = "light", className }: NewsProps) {
    // Data State
    const [news, setNews] = useState<NewsItem[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Filter State
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");

    // Admin State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        summary: "",
        images: [] as ImageSource[],
        published: true
    });

    const role = useCurrentRole();
    const isAdmin = role === "ADMIN";
    const isDark = variant === "dark";
    const limit = 8; // Items per page

    // Fetch News
    const fetchNews = useCallback(async (pageNum: number, reset: boolean = false, searchQuery: string = "") => {
        try {
            if (reset) setIsLoading(true);
            else setIsLoadingMore(true);

            // Build query params
            const params = new URLSearchParams();
            params.append("page", pageNum.toString());
            params.append("limit", limit.toString());
            if (searchQuery) params.append("search", searchQuery);
            // Include non-published for admins? Maybe later. For now public API usually shows published.
            // If we want admin view, we'd add logic here.

            const res = await fetch(`/api/news?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const response = await res.json();

            if (response.success && response.data) {
                const newItems = response.data;
                setNews(prev => reset ? newItems : [...prev, ...newItems]);
                setHasMore(newItems.length === limit); // Simple check, or use response.pagination.page < totalPages
                setPage(pageNum);
            } else {
                if (reset) setNews([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching news:", error);
            toast.error("Nepodařilo se načíst aktuality");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [limit]); // Removed 'page' from dependencies to avoid loop, passed as arg

    // Initial Load & Search Effect
    useEffect(() => {
        fetchNews(1, true, search);
    }, [search, fetchNews]); // Re-fetch when search changes (debounced in Filter component)

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchNews(page + 1, false, search);
        }
    };

    // Admin Functions
    const resetForm = () => {
        setFormData({ title: "", content: "", summary: "", images: [], published: true });
        setEditId(null);
    };

    const handleEdit = (item: NewsItem) => {
        setEditId(item.id);
        setFormData({
            title: item.title,
            content: item.content || "",
            summary: item.summary || "",
            images: item.images || [],
            published: item.published
        });
        setOpen(true);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const method = editId ? "PUT" : "POST";
            const endpoint = editId ? `/api/news/${editId}` : "/api/news";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }

            toast.success(editId ? "Aktualita upravena" : "Aktualita přidána");
            setOpen(false);
            resetForm();
            fetchNews(1, true, search); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error("Chyba při ukládání");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (file: File, title: string) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setFormData(prev => ({ ...prev, images: [...prev.images, { url: data.url, public_id: data.public_id, title: data.title }] }));
    };

    // Render
    return (
        <div className={cn("w-full max-w-7xl mx-auto space-y-8", className)}>
            {/* Header & Controls */}
            {(showHeader || isAdmin) && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {showHeader && (
                            <h2 className={cn("text-3xl font-bold", isDark ? "text-white" : "text-gray-900")}>
                                Aktuality
                            </h2>
                        )}

                        {isAdmin && showAddButton && (
                            <IOSButton
                                onClick={() => { resetForm(); setOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-500/20 w-fit ml-auto"
                                icon={<Plus className="w-4 h-4" />}
                            >
                                Nová aktualita
                            </IOSButton>
                        )}
                    </div>

                    <NewsFilter
                        onSearchChange={setSearch}
                        onViewChange={setView}
                        variant={variant}
                    />
                </div>
            )}

            {/* Content Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className={cn("w-8 h-8 animate-spin", isDark ? "text-white/30" : "text-gray-300")} />
                </div>
            ) : news.length === 0 ? (
                <div className={cn(
                    "flex flex-col items-center justify-center py-20 rounded-3xl border",
                    isDark ? "bg-black/20 border-white/5 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"
                )}>
                    <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nebyly nalezeny žádné aktuality</p>
                </div>
            ) : (
                <div className={cn(
                    "grid gap-6 transition-all",
                    view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                )}>
                    <AnimatePresence mode="popLayout">
                        {news.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                            >
                                <div className="relative group h-full">
                                    <NewsCard
                                        item={item}
                                        variant={variant}
                                        priority={index < 4}
                                    />

                                    {/* Admin Overlay Controls */}
                                    {isAdmin && (
                                        <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleEdit(item); }}
                                                className="bg-black/75 backdrop-blur text-white text-xs px-2 py-1 rounded hover:bg-black"
                                            >
                                                Editovat
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Load More */}
            {hasMore && !isLoading && (
                <div className="flex justify-center pt-8">
                    <IOSButton
                        variant="ghost"
                        onClick={handleLoadMore}
                        loading={isLoadingMore}
                        className={cn(isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
                        icon={<ChevronDown className="w-4 h-4" />}
                    >
                        Načíst další
                    </IOSButton>
                </div>
            )}

            {/* Admin Dialog (Simplified for now, can be expanded) */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className={cn("max-w-3xl max-h-[90vh] overflow-y-auto", isDark ? "bg-gray-900 border-gray-800 text-white" : "bg-white")}>
                    <DialogTitle>{editId ? "Upravit aktualitu" : "Nová aktualita"}</DialogTitle>
                    <DialogDescription className="hidden">Formulář aktuality</DialogDescription>

                    <div className="space-y-4 mt-4">
                        <Input
                            placeholder="Nadpis"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className={isDark ? "bg-black/40 border-gray-700" : ""}
                        />
                        <Input
                            placeholder="Krátký souhrn (max 500 znaků)"
                            value={formData.summary}
                            onChange={e => setFormData({ ...formData, summary: e.target.value })}
                            className={isDark ? "bg-black/40 border-gray-700" : ""}
                        />
                        <div className={cn("border rounded-md min-h-[200px]", isDark ? "border-gray-700 bg-white text-black" : "border-gray-200")}>
                            <RichTextEditor
                                value={formData.content}
                                onChange={val => setFormData({ ...formData, content: val })}
                                placeholder="Obsah..."
                            />
                        </div>
                        <EnhancedImageUpload
                            sources={formData.images}
                            onUpload={handleImageUpload}
                            onDelete={async (pid) => setFormData(p => ({ ...p, images: p.images.filter(i => i.public_id !== pid) }))}
                            count={1} // For now limit to 1 main image for simplicity of card, or update card to slideshow
                        />
                        <div className="flex justify-end gap-2">
                            <IOSButton variant="ghost" onClick={() => setOpen(false)}>Zrušit</IOSButton>
                            <IOSButton onClick={handleSubmit} loading={isSubmitting}>Uložit</IOSButton>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}