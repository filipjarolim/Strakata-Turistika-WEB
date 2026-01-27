import { currentUser, currentRole } from "@/lib/auth";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import News from "@/components/blocks/News";
import { FeaturedNews } from "@/components/blocks/FeaturedNews";
import { NewsService, NewsItem } from "@/lib/news-service";
import Image from "next/image";
import { Bell } from "lucide-react";

export default async function AktualityPage() {
    const user = await currentUser();
    const role = await currentRole();

    // Fetch latest news for featured section (SSR)
    let featuredNews: NewsItem[] = [];
    try {
        const res = await NewsService.getNews({ limit: 5, publishedOnly: true });
        featuredNews = res.data;
    } catch (e) {
        console.error("Failed to load featured news", e);
    }

    return (
        <div className="relative min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-blue-500/30">
            {/* Header - responsive theme */}
            <Header
                user={user}
                role={role}
                mode="fixed"
                theme="light"
                showGap={false}
            />

            {/* Background */}
            <div className="fixed inset-0 w-full h-full -z-10 dark:opacity-100 opacity-0 transition-opacity">
                <Image
                    src="/images/news-bg.png"
                    alt="News Background"
                    fill
                    className="object-cover opacity-60 pointer-events-none select-none"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90 pointer-events-none" />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-4 sm:px-8 lg:px-16 container mx-auto space-y-16">
                {/* Hero Section */}
                <div className="space-y-8">
                    <div className="flex flex-col items-center sm:items-start space-y-6 text-center sm:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm">
                            <Bell className="w-4 h-4 text-blue-300" />
                            <span className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Strakatá Turistika</span>
                        </div>

                        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-white leading-tight drop-shadow-2xl dark:drop-shadow-none tracking-tight">
                            Aktuality & <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                                Novinky
                            </span>
                        </h1>
                    </div>

                    {/* Featured Carousel */}
                    {featuredNews.length > 0 && (
                        <div className="w-full mt-10">
                            <FeaturedNews items={featuredNews} />
                        </div>
                    )}
                </div>

                {/* Main News Feed */}
                <div className="w-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px bg-gray-200 dark:bg-white/20 flex-1" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Všechny příspěvky</h2>
                        <div className="h-px bg-gray-200 dark:bg-white/20 flex-1" />
                    </div>

                    {/* 
                        We render News component. 
                        It handles fetching all news (with pagination and search). 
                        We hide header/add button logic inside it if needed, or customize via props.
                    */}
                    <News
                        showHeader={false}
                        showAddButton={true}
                        variant="light"
                        className="!max-w-none"
                    />
                </div>
            </main>

            <Footer user={user} role={role} />
        </div>
    );
}
