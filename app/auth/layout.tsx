"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const isProfilePage = pathname === "/auth/profil";

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-screen bg-gray-50 dark:bg-zinc-950" />;
    }

    if (isProfilePage) {
        return <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">{children}</div>;
    }

    const isDark = resolvedTheme === "dark";

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-950">
            {/* Background Images with AnimatePresence for smooth transitions */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={isDark ? "dark" : "light"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src={isDark ? "/images/whimsical_landscape_night.png" : "/images/whimsical_landscape_day.png"}
                        alt="Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Immersive Overlay */}
                    <div className={cn(
                        "absolute inset-0 transition-colors duration-1000",
                        isDark
                            ? "bg-black/60 backdrop-blur-[2px]"
                            : "bg-white/30 backdrop-blur-[1px]"
                    )} />
                </motion.div>
            </AnimatePresence>

            {/* Ambient Blobs for extra depth */}
            <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
                <div className={cn(
                    "absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] mix-blend-soft-light animate-pulse",
                    isDark ? "bg-blue-900/20" : "bg-blue-400/20"
                )} />
                <div className={cn(
                    "absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] mix-blend-soft-light animate-pulse delay-700",
                    isDark ? "bg-purple-900/20" : "bg-purple-400/20"
                )} />
            </div>

            {/* Content Container */}
            <main className="relative z-10 w-full px-4 py-12 flex items-center justify-center min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full"
                >
                    {children}
                </motion.div>
            </main>

            {/* Footer Branding */}
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
                <p className={cn(
                    "text-xs font-medium tracking-widest uppercase transition-colors duration-500",
                    isDark ? "text-white/40" : "text-black/60"
                )}>
                    Strakatá Turistika © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
