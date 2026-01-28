"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Search, ChevronLeft, Newspaper, Calendar, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { AdminToolbar, AdminToolbarGroup } from '@/components/admin/AdminToolbar';
import { AdminSearch } from '@/components/ui/admin-search';
import { DataTableRowActions } from '@/components/admin/DataTableRowActions';
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

import { AdminPageTemplate } from "@/components/admin/AdminPageTemplate";

interface NewsItem {
    id: string;
    title: string;
    slug: string | null;
    content: string | null;
    summary: string | null;
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
    tags: unknown;
    images: unknown;
    author: { name: string | null; image: string | null } | null;
}

export const NewsClient = ({ initialNews }: { initialNews: unknown[] }) => {
    const router = useRouter();
    // Safety cast
    const [news, setNews] = useState<NewsItem[]>(initialNews as NewsItem[]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        summary: "",
        content: "",
        published: true,
        tags: ""
    });

    const handleCreate = () => {
        setEditingItem(null);
        setFormData({ title: "", summary: "", content: "", published: true, tags: "" });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: NewsItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            summary: item.summary || "",
            content: item.content || "",
            published: item.published,
            tags: Array.isArray(item.tags) ? (item.tags as string[]).join(", ") : ""
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            const url = editingItem ? `/api/news/${editingItem.id}` : "/api/news";
            const method = editingItem ? "PATCH" : "POST";

            const payload = {
                title: formData.title,
                summary: formData.summary,
                content: formData.content,
                published: formData.published,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
            };

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success(editingItem ? "Aktualita upravena" : "Aktualita vytvořena");
            router.refresh();
            setIsDialogOpen(false);

            // Reload window to ensure fresh data
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Chyba při ukládání");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Opravdu smazat?")) return;
        try {
            await fetch(`/api/news/${id}`, { method: "DELETE" });
            toast.success("Smazáno");
            setNews(news.filter(n => n.id !== id));
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Chyba při mazání");
        }
    };

    const filteredNews = news.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.content && n.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AdminPageTemplate
            title="Aktuality"
            subtitle="Obsah & Komunikace"
            category="Web & Social"
            description="Správa novinek a článků pro uživatele"
            icon="FileText"
            backHref="/admin"
            actions={
                <Button
                    onClick={handleCreate}
                    className="h-11 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl px-6 text-xs font-black hover:opacity-90 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nová aktualita
                </Button>
            }
            search={
                <div className="w-full min-w-[200px]">
                    <AdminSearch
                        value={searchTerm}
                        onSearch={setSearchTerm}
                        placeholder="Hledat aktuality..."
                    />
                </div>
            }
            containerClassName="bg-transparent border-none shadow-none backdrop-blur-none p-0 sm:p-0"
        >

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredNews.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group flex flex-col bg-white/60 dark:bg-black/20 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="p-5 flex-1 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Badge
                                        variant={item.published ? "default" : "secondary"}
                                        className={item.published
                                            ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-0"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-0"
                                        }
                                    >
                                        {item.published ? "Publikováno" : "Koncept"}
                                    </Badge>
                                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(item.createdAt), "d. MMM", { locale: cs })}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                        {item.summary || (item.content ? item.content.substring(0, 120) + "..." : "Bez obsahu")}
                                    </p>
                                </div>

                                {item.updatedAt > item.createdAt && (
                                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 pt-2">
                                        <CalendarClock className="h-3 w-3" />
                                        Upraveno {format(new Date(item.updatedAt), "d. MMM HH:mm", { locale: cs })}
                                    </div>
                                )}
                            </div>

                            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-end gap-2">
                                <DataTableRowActions>
                                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                                        <Edit className="mr-2 h-4 w-4" /> Upravit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Smazat
                                    </DropdownMenuItem>
                                </DataTableRowActions>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black/90 border-gray-200 dark:border-white/10 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl text-gray-900 dark:text-white">
                            {editingItem ? "Upravit aktualitu" : "Nová aktualita"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label className="text-gray-700 dark:text-gray-200">Titulek</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                                placeholder="Zadejte nadpis..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-gray-700 dark:text-gray-200">Stručný výpis (perex)</Label>
                            <Textarea
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 h-20 text-gray-900 dark:text-white"
                                placeholder="Krátký popis pro seznam..."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-gray-700 dark:text-gray-200">Obsah</Label>
                            <Textarea
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 min-h-[300px] font-mono text-gray-900 dark:text-white"
                                placeholder="Obsah článku (Markdown podporován)..."
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pro formátování můžete použít Markdown.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-gray-700 dark:text-gray-200">Tagy (oddělené čárkou)</Label>
                            <Input
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                                placeholder="novinka, důležité, ..."
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.published}
                                onCheckedChange={checked => setFormData({ ...formData, published: checked })}
                            />
                            <Label className="text-gray-700 dark:text-gray-200">Publikovat ihned</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-gray-700 dark:text-gray-200">Zrušit</Button>
                        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">Uložit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminPageTemplate>
    );
};
