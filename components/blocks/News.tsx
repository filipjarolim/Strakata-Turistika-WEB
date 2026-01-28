"use client";

import { useEffect, useState, useCallback } from "react";
import { NewsCard } from "@/components/blocks/NewsCard";
import { NewsFilter } from "@/components/blocks/NewsFilter";
import { IOSButton } from "@/components/ui/ios/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EnhancedImageUpload, ImageSource } from "@/components/ui/ios/enhanced-image-upload";
import { RichTextEditor } from "@/components/ui/ios/rich-text-editor";
import { Loader2, Plus, AlertCircle, ChevronDown, Trash2, Calendar as CalendarIcon, Eye, EyeOff } from "lucide-react";
import { useCurrentRole } from "@/hooks/use-current-role";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { NewsItem } from "@/lib/news-service";
import { deleteNews } from "@/actions/news-actions";
import { Switch } from "@/components/ui/switch";

interface NewsProps {
    showHeader?: boolean;
    showAddButton?: boolean;
    className?: string;
    variant?: "light" | "dark" | "default"; // Architectural fix: Added variant prop to support visual variants expected by consumers
}

export default function News({ showHeader = true, showAddButton = true, className, variant }: NewsProps) {
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
        published: true,
        createdAt: new Date().toISOString().slice(0, 16)
    });

    const role = useCurrentRole();
    const isAdmin = role === "ADMIN";
    const limit = 8; // Items per page

    // Fetch News
    const fetchNews = useCallback(async (pageNum: number, reset: boolean = false, searchQuery: string = "") => {
        try {
            if (reset) setIsLoading(true);
            else setIsLoadingMore(true);

            const params = new URLSearchParams();
            params.append("page", pageNum.toString());
            params.append("limit", limit.toString());
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/news?${params.toString()}`);

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to fetch");
            }

            const response = await res.json();

            if (response.success && response.data) {
                const newItems = response.data;
                setNews(prev => reset ? newItems : [...prev, ...newItems]);
                setHasMore(newItems.length === limit);
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
    }, [limit]);

    // Initial Load & Search Effect
    useEffect(() => {
        fetchNews(1, true, search);
    }, [search, fetchNews]);

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            fetchNews(page + 1, false, search);
        }
    };

    // Admin Functions
    const resetForm = () => {
        setEditId(null);
        setFormData({
            title: "",
            content: "",
            summary: "",
            images: [],
            published: true,
            createdAt: new Date().toISOString().slice(0, 16)
        });
    };

    const handleEdit = (item: NewsItem) => {
        setEditId(item.id);
        setFormData({
            title: item.title,
            content: item.content || "",
            summary: item.summary || "",
            images: item.images || [],
            published: item.published ?? true,
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
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
            fetchNews(1, true, search);
        } catch (error) {
            console.error(error);
            toast.error("Chyba při ukládání");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!confirm("Opravdu chcete smazat tuto aktualitu?")) return;

        try {
            setIsSubmitting(true);
            const res = await deleteNews(id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Aktualita smazána");
                if (open) setOpen(false);
                fetchNews(1, true, search);
            }
        } catch (error) {
            console.error(error);
            toast.error("Nepodařilo se smazat aktualitu");
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

    return (
        <div className={cn("w-full max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8", className)}>
            {(showHeader || isAdmin) && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {showHeader && (
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
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
                    />
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300 dark:text-white/30" />
                </div>
            ) : news.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-3xl border bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400">
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
                                        priority={index < 4}
                                    />

                                    {isAdmin && (
                                        <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={(e) => { e.preventDefault(); handleEdit(item); }}
                                                className="bg-black/75 backdrop-blur text-white text-xs px-2 py-1 rounded-lg hover:bg-black transition-colors"
                                            >
                                                Upravit
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="bg-red-600/90 backdrop-blur text-white p-1.5 rounded-lg hover:bg-red-700 transition-colors"
                                                title="Smazat"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {hasMore && !isLoading && (
                <div className="flex justify-center pt-8">
                    <IOSButton
                        variant="ghost"
                        onClick={handleLoadMore}
                        loading={isLoadingMore}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                        icon={<ChevronDown className="w-4 h-4" />}
                    >
                        Načíst další
                    </IOSButton>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <DialogTitle>{editId ? "Upravit aktualitu" : "Nová aktualita"}</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400">
                        {editId ? "Zde můžete upravit stávající aktualitu." : "Přidejte novou aktualitu pro vaše uživatele."}
                    </DialogDescription>

                    <div className="space-y-4 mt-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1.5 block">Nadpis</label>
                                <Input
                                    placeholder="Nadpis aktuality"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                />
                            </div>
                            <div className="sm:w-64">
                                <label className="text-sm font-medium mb-1.5 block">Datum zveřejnění</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.createdAt}
                                    onChange={e => setFormData({ ...formData, createdAt: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <Switch
                                checked={formData.published}
                                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                                id="published-mode"
                            />
                            <label
                                htmlFor="published-mode"
                                className="text-sm font-medium cursor-pointer flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            >
                                {formData.published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                                {formData.published ? "Publikováno (veřejné)" : "Skryto (koncept)"}
                            </label>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Krátký souhrn</label>
                            <Input
                                placeholder="Stručný popis pro náhled (max 500 znaků)"
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Obsah aktuality</label>
                            <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-black/20">
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={val => setFormData({ ...formData, content: val })}
                                    placeholder="Napište obsah aktuality..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Obrázek</label>
                            <EnhancedImageUpload
                                sources={formData.images}
                                onUpload={handleImageUpload}
                                onDelete={async (pid) => setFormData(p => ({ ...p, images: p.images.filter(i => i.public_id !== pid) }))}
                                count={1}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-100 dark:border-white/10">
                            {editId ? (
                                <IOSButton
                                    variant="outline"
                                    className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                    onClick={() => handleDelete(editId)}
                                    loading={isSubmitting}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Smazat
                                </IOSButton>
                            ) : <div></div>}
                            <div className="flex gap-2">
                                <IOSButton variant="ghost" onClick={() => setOpen(false)}>Zrušit</IOSButton>
                                <IOSButton onClick={handleSubmit} loading={isSubmitting}>Uložit aktualitu</IOSButton>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}