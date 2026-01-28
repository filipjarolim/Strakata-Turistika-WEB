"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { Navbar } from "@/components/navigation/Navbar";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import basicInfo from "@/lib/settings/basicInfo";
import { cn } from "@/lib/utils";
import { ExtendedUser } from "@/next-auth";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Header = ({
    user,
    role,
    mode = "fixed",
    showGap = true,
    theme, // Architectual fix: Exposed theme prop to allow consumer control over header appearance
}: {
    user?: ExtendedUser | null;
    role?: string;
    mode?: "fixed" | "static" | "auto-hide";
    showGap?: boolean;
    theme?: "light" | "dark";
}) => {
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isMobile = useIsMobile();
    const headerRef = useRef<HTMLElement | null>(null);

    const isHome = pathname === "/";

    useEffect(() => {
        const updateHeaderHeight = () => {
            if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
        };

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (mode === "auto-hide") {
                if (currentScrollY < 100) {
                    setIsVisible(true);
                } else if (currentScrollY > lastScrollY) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                setLastScrollY(currentScrollY);
            }
        };

        updateHeaderHeight();
        window.addEventListener("resize", updateHeaderHeight);
        if (mode !== "static") window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("resize", updateHeaderHeight);
            if (mode !== "static") window.removeEventListener("scroll", handleScroll);
        };
    }, [mode, lastScrollY]);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    return (
        <>
            <header
                ref={headerRef}
                className={cn(
                    "w-[95%] sm:w-[92%] md:w-[90%] mx-auto px-4 py-3 rounded-b-xl z-50 transition-all duration-300",
                    mode !== "static" && "fixed left-1/2 -translate-x-1/2",
                    mode === "auto-hide" && !isVisible && "-translate-y-full opacity-0",
                    "bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-black/5 dark:border-white/10 shadow-lg",
                    "flex items-center justify-between"
                )}
            >
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">
                        Strakatá Turistika
                    </span>
                </Link>

                <div className="hidden md:flex items-center justify-center flex-1 px-8">
                    <Navbar />
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                        {!user ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full font-semibold"
                                    onClick={() => window.location.href = "/auth/login"}
                                >
                                    Přihlásit se
                                </Button>
                                <Button
                                    size="sm"
                                    className="rounded-full font-semibold bg-gray-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-transform"
                                    onClick={() => window.location.href = "/auth/register"}
                                >
                                    Začít
                                </Button>
                            </>
                        ) : (
                            <UserButton role={role} />
                        )}
                    </div>

                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Menu className="h-6 w-6 text-gray-900 dark:text-white" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:w-[400px] border-none bg-white/95 dark:bg-black/95 backdrop-blur-xl p-0">
                            <SheetHeader className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-row items-center justify-between">
                                <SheetTitle className="text-xl font-bold dark:text-white">Menu</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col p-6 gap-2">
                                <MobileNavLink href="/" active={pathname === "/"} onClick={() => setIsMobileMenuOpen(false)}>Domů</MobileNavLink>
                                <MobileNavLink href="/soutez" active={pathname === "/soutez"} onClick={() => setIsMobileMenuOpen(false)}>Soutěžit</MobileNavLink>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Informace</p>
                                    <MobileNavLink href="/kontakty" secondary onClick={() => setIsMobileMenuOpen(false)}>Kontakty</MobileNavLink>
                                    <MobileNavLink href="/fotogalerie" secondary onClick={() => setIsMobileMenuOpen(false)}>Fotogalerie</MobileNavLink>
                                    <MobileNavLink href="/pravidla" secondary onClick={() => setIsMobileMenuOpen(false)}>Pravidla</MobileNavLink>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Výsledky</p>
                                    <MobileNavLink href="/vysledky" secondary onClick={() => setIsMobileMenuOpen(false)}>Přehled</MobileNavLink>
                                    <MobileNavLink href="/vysledky/moje" secondary onClick={() => setIsMobileMenuOpen(false)}>Moje návštěvy</MobileNavLink>
                                </div>
                                <div className="mt-8 flex flex-col gap-3">
                                    {!user ? (
                                        <>
                                            <Button className="w-full h-12 rounded-xl" variant="secondary" onClick={() => window.location.href = "/auth/login"}>Přihlásit se</Button>
                                            <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.location.href = "/auth/register"}>Začít</Button>
                                        </>
                                    ) : (
                                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center gap-3">
                                            <UserButton role={role} />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold dark:text-white">{user.name}</span>
                                                <span className="text-xs text-gray-500">{user.email}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>
            {mode !== "static" && showGap && <div style={{ height: `${headerHeight}px` }} />}
        </>
    );
};

const MobileNavLink = ({ href, children, active, secondary, onClick }: { href: string; children: React.ReactNode; active?: boolean; secondary?: boolean; onClick: () => void }) => (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all",
            active
                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : secondary
                    ? "text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5"
                    : "text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-white/5"
        )}
    >
        {children}
        {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
    </Link>
);

export default Header;