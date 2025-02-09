"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Trash, Pencil } from "lucide-react";
import { Shield } from "lucide-react"; // Icon from lucide-react
import { useCurrentRole } from "@/hooks/use-current-role"; // Role hook
import { AdminRestrictedContent } from "../structure/AdminRestrictedContent";
import {Separator} from "@/components/ui/separator";

type NewsItem = {
    id: string;
    title: string;
    content?: string;
    createdAt: Date;
};

export default function News() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [open, setOpen] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [editId, setEditId] = useState<string | null>(null);
    const role = useCurrentRole(); // Get the current role

    useEffect(() => {
        fetchNews().then(() => console.log("News fetched"));
    }, []);

    async function fetchNews(): Promise<void> {
        const res = await fetch("/api/news");
        const data: NewsItem[] = await res.json();
        setNews(data);
    }

    async function handleSubmit(): Promise<void> {
        console.log(title, content);
        console.log("SUBMITTING");
        const method = editId ? "PUT" : "POST";
        const endpoint = editId ? `/api/news/${editId}` : "/api/news";

        await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
        }).then((r) => {
            console.log("Submitted");
            console.log(r);
        });

        await fetchNews();
        setOpen(false);
        setTitle("");
        setContent("");
        setEditId(null);
    }

    async function handleDelete(id: string): Promise<void> {
        await fetch(`/api/news/${id}`, { method: "DELETE" });
        await fetchNews();
    }

    async function handleEdit(newsItem: NewsItem): Promise<void> {
        setTitle(newsItem.title);
        setContent(newsItem.content || "");
        setEditId(newsItem.id);
        setOpen(true);
    }

    return (
        <div className="p-8">
            <h2 className="text-4xl font-bold mb-6">Aktuality</h2>
            <AdminRestrictedContent
                role={role || "UŽIVATEL"}
                permittedRole="ADMIN"
                isButton={true}
                label="Přidat aktualitu"
                tooltipText="ADMIN ONLY - Add news item"
                onClick={() => setOpen(!open)}
            />

            <div className="flex flex-wrap items-center justify-start gap-8 w-full">
                {news.map((item) => (
                    <Card key={item.id} className="w-[400px] h-[260px] p-6 rounded-[25px] relative">
                        <h3 className="text-2xl font-bold mb-4 text-gray-700/90">{item.title}</h3>
                        <p className="text-gray-500">{item.content}</p>
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                <Pencil className="w-5 h-5 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                <Trash className="w-5 h-5 text-red-600" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={open} modal={true} onOpenChange={setOpen}>
                <DialogTrigger asChild></DialogTrigger>
                <DialogContent>
                    <DialogTitle className="text-xl font-bold">{editId ? "Upravit aktualitu" : "Přidat aktualitu"}</DialogTitle>
                    <Input
                        placeholder="Název"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                        placeholder="Obsah (volitelné)"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                    <Button onClick={handleSubmit}>{editId ? "Uložit změny" : "Přidat"}</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}