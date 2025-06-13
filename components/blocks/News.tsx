"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type NewsItem = {
    id: string;
    title: string;
    content?: string;
    createdAt: Date;
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
    const role = useCurrentRole(); // Get the current role

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
                body: JSON.stringify({ title, content }),
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

    return (
        <div className="p-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-bold text-gray-800">Aktuality</h2>
                <AdminRestrictedContent
                    role={role || "UŽIVATEL"}
                    tooltipText="Přidat aktualitu"
                    onClick={() => setOpen(true)}
                >
                    Přidat aktualitu
                </AdminRestrictedContent>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map((item) => (
                        <Card 
                            key={item.id} 
                            className="group relative overflow-hidden bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                            <Link 
                                href={`/aktuality/${item.id}`}
                                className="block p-6"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600" />
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-bold mb-2 text-gray-800">{item.title}</h3>
                                            <time className="text-sm text-gray-500">
                                                {format(new Date(item.createdAt), "d. MMMM yyyy", { locale: cs })}
                                            </time>
                                        </div>
                                        <div className="flex gap-2 ml-4 z-10">
                                            <AdminRestrictedContent
                                                role={role || "UŽIVATEL"}
                                                variant="icon"
                                                tooltipText="Upravit"
                                                icon={<Pencil className="w-4 h-4" />}
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    router.push(`/aktuality/${item.id}?edit=true`);
                                                }}
                                            />
                                            <AdminRestrictedContent
                                                role={role || "UŽIVATEL"}
                                                variant="icon"
                                                tooltipText="Smazat"
                                                icon={<Trash className="w-4 h-4" />}
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    handleDelete(item.id);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-gray-600">
                                        {item.content}
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400/20 to-blue-600/20" />
                            </Link>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}