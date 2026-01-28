"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    Calendar,
    Clock,
    ArrowLeft,
    Share2,
    User,
    Tag,
    Pencil,
    Loader2,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCurrentRole } from "@/hooks/use-current-role";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IOSButton } from "@/components/ui/ios/button";

// Import types
import { ImageSource } from "@/components/ui/ios/enhanced-image-upload";

interface NewsItem {
    id: string;
    title: string;
    slug: string;
    content?: string;
    summary?: string;
    published: boolean;
    tags?: string[];
    createdAt: Date | string;
    images?: ImageSource[];
    author?: { name: string; image: string };
}

export default function NewsDetail({ params }: { params: Promise<{ aktualita: string }> }) {
    // Unrap params properly for Next.js 15
    const { aktualita } = use(params);

    const router = useRouter();
    const searchParams = useSearchParams();
    const isEditMode = searchParams.get("edit") === "true";

    const user = useCurrentUser();
    const role = useCurrentRole();
    const isAdmin = role === "ADMIN";

    const [news, setNews] = useState<NewsItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);

    // Scroll effect for header
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const fetchNews = useCallback(async () => {
        try {
            const res = await fetch(`/api/news/${aktualita}`);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            if (data.success && data.data) {
                setNews(data.data);
            }
        } catch (e) {
            console.error(e);
            toast.error("Nepodařilo se načíst detail aktuality");
        } finally {
            setIsLoading(false);
        }
    }, [aktualita]);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Format helpers
    const formatDate = (date: Date | string) => {
        try { return format(new Date(date), "d. MMMM yyyy", { locale: cs }); } catch (e) { return ""; }
    };
    const formatTime = (date: Date | string) => {
        try { return format(new Date(date), "HH:mm", { locale: cs }); } catch (e) { return ""; }
    };

    // Loading State
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    // Not Found
    if (!news) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-16 h-16 text-gray-700 mb-6" />
                <h1 className="text-2xl font-bold mb-2">Aktualita nenalezena</h1>
                <p className="text-gray-500 mb-8">Požadovaný článek neexistuje nebo byl smazán.</p>
                <Link href="/aktuality">
                    <IOSButton>Zpět na přehled</IOSButton>
                </Link>
            </div>
        );
    }

    const mainImage = news.images && news.images.length > 0 ? news.images[0].url : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white selection:bg-blue-500/30 font-sans transition-colors duration-300">
            <Header user={user} role={role} mode="fixed" showGap={false} />

            {/* Hero Image Background (Parallax-ish) */}
            <div className="fixed inset-0 top-0 h-[60vh] w-full z-0 pointer-events-none">
                {mainImage ? (
                    <Image
                        src={mainImage}
                        alt={news.title}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-blue-50 dark:from-gray-900 dark:via-black dark:to-blue-900/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent" />
            </div>

            <main className="relative z-10 pt-[30vh] pb-20 px-4 sm:px-8 lg:px-16 container mx-auto">
                <article className="max-w-4xl mx-auto">
                    {/* Article Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-12"
                    >
                        {/* Back Link */}
                        <Link href="/aktuality" className="inline-flex items-center gap-2 text-gray-700 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors mb-8 group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Zpět na aktuality
                        </Link>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-blue-600 dark:text-blue-300 mb-6">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur">
                                <Calendar className="w-4 h-4" />
                                {formatDate(news.createdAt)}
                            </div>
                            <div className="flex items-center gap-2 opacity-80 decoration-slate-900 dark:text-gray-300">
                                <Clock className="w-4 h-4" />
                                {formatTime(news.createdAt)}
                            </div>
                            {news.author && (
                                <div className="flex items-center gap-2 opacity-80 pl-4 border-l border-gray-300 dark:border-white/20 dark:text-gray-300">
                                    <User className="w-4 h-4" />
                                    {news.author.name || "Strakatá Turistika"}
                                </div>
                            )}
                        </div>

                        {/* Title - Keep dark/light aware but ensure contrast over potential image if needed */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight text-gray-900 dark:text-white mb-8 drop-shadow-sm dark:drop-shadow-2xl">
                            {news.title}
                        </h1>

                        {/* Tags */}
                        {news.tags && news.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-8">
                                {news.tags.map((tag, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all cursor-default">
                                        <Tag className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Summary */}
                        {news.summary && (
                            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 font-light leading-relaxed border-l-4 border-blue-500 pl-6 py-2 bg-blue-50 dark:bg-blue-500/5 rounded-r-xl">
                                {news.summary}
                            </p>
                        )}
                    </motion.div>

                    {/* Article Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-10 md:p-14 shadow-xl dark:shadow-2xl"
                    >
                        {/* Edit Button for Admin */}
                        {isAdmin && (
                            <div className="flex justify-end mb-6">
                                <button className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Pencil className="w-3 h-3" />
                                    SPRAVOVAT (Admin)
                                </button>
                            </div>
                        )}

                        <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-2xl prose-img:shadow-xl">
                            {news.content ? (
                                <div dangerouslySetInnerHTML={{ __html: news.content }} />
                            ) : (
                                <p className="text-gray-500 italic">...další obsah není k dispozici...</p>
                            )}
                        </div>

                        {/* Gallery Grid for Extra Images */}
                        {news.images && news.images.length > 1 && (
                            <div className="mt-16 pt-16 border-t border-gray-200 dark:border-white/10">
                                <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Galerie</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {news.images.slice(1).map((img, idx) => (
                                        <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                                            <Image
                                                src={img.url}
                                                alt={img.title || ""}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="mt-16 flex items-center justify-between border-t border-gray-200 dark:border-white/10 pt-8 text-sm text-gray-500">
                            <div>
                                Strakatá Turistika © {new Date().getFullYear()}
                            </div>
                            <div className="flex gap-4">
                                <button className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Share2 className="w-4 h-4" />
                                    Sdílet
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </article>
            </main>

            <Footer user={user} role={role} />
        </div>
    );
}