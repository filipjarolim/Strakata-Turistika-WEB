"use client";

import React, { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import { useRouter } from 'next/navigation';
import MojeClient from './moje-client';
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MojeVysledkyPage() {
    const user = useCurrentUser();
    const role = useCurrentRole();
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            router.push('/prihlaseni?callbackUrl=/vysledky/moje');
        }
    }, [user, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white selection:bg-blue-500/30 font-sans transition-colors duration-300">
            <Header user={user} role={role} mode="fixed" showGap={false} />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-100 dark:bg-purple-900/10 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 pt-32 pb-20 px-4 sm:px-8 lg:px-16 container mx-auto">
                {/* Navigation */}
                <div className="mb-8">
                    <Link href="/vysledky" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Zpět na výsledky
                    </Link>
                </div>

                {/* Header */}
                <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl border border-white/20 dark:border-white/10 text-white">
                        <span className="text-3xl font-black">
                            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                            Moje Výsledky
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                            Přehled vašich úspěchů, bodů a navštívených míst.
                        </p>
                    </div>
                </div>

                {/* Client Component */}
                <MojeClient />
            </main>

            <Footer user={user} role={role} />
        </div>
    );
}