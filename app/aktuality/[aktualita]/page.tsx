"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { toast } from "sonner";
import { useCurrentRole } from "@/hooks/use-current-role";
import { AdminRestrictedContent } from "@/components/structure/AdminRestrictedContent";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Card } from "@/components/ui/card";

type User = {
    id: string;
    name?: string;
    email?: string;
} | null;

type NewsItem = {
    id: string;
    title: string;
    content?: string;
    createdAt: Date;
};

export default function NewsDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const role = useCurrentRole();
    const isEditMode = searchParams.get("edit") === "true";

    const [userData, setUserData] = useState<{ user: User; role: string | null }>({ 
        user: null, 
        role: null 
    });
    const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);

    const fetchNewsData = async () => {
        try {
            const [userResponse, roleResponse] = await Promise.all([
                fetch('/api/auth/me'),
                fetch('/api/auth/role')
            ]);
            
            if (!userResponse.ok || !roleResponse.ok) {
                throw new Error("Failed to fetch user data");
            }

            const [user, role] = await Promise.all([
                userResponse.json(),
                roleResponse.json()
            ]);
            setUserData({ user, role });
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUserData({ user: null, role: null });
        }
    };

    const fetchNewsItem = useCallback(async () => {
        try {
            const response = await fetch(`/api/aktuality/${params.aktualita}`);
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
        fetchNewsData();
        fetchNewsItem();
    }, [params.aktualita, fetchNewsItem]);

    async function handleSubmit() {
        try {
            setIsSubmitting(true);
            const response = await fetch(`/api/news/${params.aktualita}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content }),
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
            contents={{complete: true}} 
            currentUser={userData.user}
            currentRole={userData.role}
        >
            <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-gray-100"
                    onClick={() => router.push("/aktuality")}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Zpět na aktuality
                </Button>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                    </div>
                ) : isEditMode ? (
                    <Card className="p-6 space-y-6 shadow-lg">
                        <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 -mx-6 -mt-6" />
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Upravit aktualitu</h2>
                        </div>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Název aktuality"
                            className="text-xl font-bold"
                        />
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Obsah aktuality"
                            className="min-h-[300px]"
                        />
                        <div className="flex justify-end gap-4">
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
                                {isSubmitting && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Uložit změny
                            </Button>
                        </div>
                    </Card>
                ) : newsItem && (
                    <Card className="overflow-hidden shadow-lg">
                        <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600" />
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">{newsItem.title}</h1>
                                    <time className="text-gray-500">
                                        {formatDate(newsItem.createdAt)}
                                    </time>
                                </div>
                                <AdminRestrictedContent
                                    role={role || "UŽIVATEL"}
                                    variant="icon"
                                    tooltipText="Upravit"
                                    icon={<Pencil className="w-4 h-4" />}
                                    onClick={() => router.push(`/aktuality/${params.aktualita}?edit=true`)}
                                />
                            </div>
                            <div className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-p:text-gray-600">
                                {newsItem.content}
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </CommonPageTemplate>
    );
}
