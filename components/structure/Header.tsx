"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { UserButton } from "@/components/auth/user-button";
import { Navbar } from "@/components/navigation/Navbar";
import { LoginButton } from "@/components/auth/login-button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import basicInfo from "@/lib/settings/basicInfo";
import { cn } from "@/lib/utils";
import { RegisterButton } from "../auth/register-button";
import { ExtendedUser } from "@/next-auth";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";

const Header = ({
    user,
    role,
    mode = "fixed",
    showGap = true,
    theme
}: {
    user?: ExtendedUser | null;
    role?: string;
    mode?: "fixed" | "static" | "auto-hide";
    showGap?: boolean;
    theme?: "light" | "dark";
}) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Determine effective theme: explicit prop > resolved system theme > default 'light'
    // We wait for mount to ensure resolvedTheme is accurate and avoid hydration mismatch
    const effectiveTheme = (mounted ? (theme || resolvedTheme) : (theme || 'light')) as "light" | "dark";

    const headerRef = useRef<HTMLElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isMobile = useIsMobile();

    const isHome = pathname === "/";
    const isTransparentHomeHeader = isHome && !isScrolled && isMobile;

    // Fixed light styling (no background detection)
    const textColor = (effectiveTheme === "dark" || isTransparentHomeHeader) ? "text-white" : "text-gray-900";
    const textColorHover = (effectiveTheme === "dark" || isTransparentHomeHeader) ? "hover:text-gray-200" : "hover:text-gray-700";

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateHeaderHeight = () => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    };

    useEffect(() => {
        updateHeaderHeight();

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (mode === "auto-hide") {
                // Always show header when near the top of the page (within 100px)
                if (currentScrollY < 100) {
                    setIsVisible(true);
                } else if (currentScrollY > lastScrollY) {
                    // Scrolling down - hide header
                    setIsVisible(false);
                } else {
                    // Scrolling up - show header
                    setIsVisible(true);
                }
                setLastScrollY(currentScrollY);
            }

            setIsScrolled(currentScrollY > 20);
        };

        // Update on window resize for responsiveness
        window.addEventListener("resize", updateHeaderHeight);
        if (mode !== "static") {
            window.addEventListener("scroll", handleScroll);
        }

        return () => {
            window.removeEventListener("resize", updateHeaderHeight);
            if (mode !== "static") {
                window.removeEventListener("scroll", handleScroll);
            }
        };
    }, [mode, lastScrollY]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Dynamic header styling based on background analysis
    const getHeaderStyles = () => {
        if (effectiveTheme === "dark") {
            // Dark theme (for News page or Dark Mode)
            return {
                background: isScrolled ? 'rgba(10, 10, 10, 0.8)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
                borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                boxShadow: isScrolled ? '0 4px 30px rgba(0, 0, 0, 0.5)' : 'none',
                color: 'white'
            };
        }

        // Default Light theme logic
        if (isMobile) {
            return {
                background: 'transparent',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
                border: 'none',
                boxShadow: 'none'
            };
        }
        if (isScrolled) {
            return {
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            };
        }
        return {
            background: 'rgba(255, 255, 255, 0.30)',
            backdropFilter: 'blur(28px) saturate(160%)',
            WebkitBackdropFilter: 'blur(28px) saturate(160%)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: 'none'
        };
    };

    // Enhanced text styling based on background analysis
    const getTextStyles = () => ({ fontWeight: '600' });

    return (
        <>
            <header
                ref={headerRef}
                className={cn(
                    "grid grid-cols-3 select-none md:grid-cols-12 w-[95%] sm:w-[92%] md:w-[90%] mx-auto px-3 sm:px-4 py-2 sm:py-3 md:rounded-b-xl min-h-fit max-h-20 relative",
                    mode !== "static" && "fixed left-1/2 translate-x-[-50%]",
                    "transition-all duration-300 ease-out",
                    mode === "auto-hide" && !isVisible && "-translate-y-[100%]"
                )}
                style={{
                    zIndex: 50,
                    ...getHeaderStyles(),
                    ...(mode === "auto-hide" && !isVisible && { boxShadow: "none" })
                }}
            >
                <Link
                    href="/"
                    className="flex flex-row items-center justify-start col-span-2 md:col-span-2 lg:col-span-2 relative z-50 h-full"
                >
                    <span
                        className={cn(
                            "text-lg sm:text-xl md:text-2xl font-bold tracking-tight transition-colors duration-200 truncate",
                            textColor,
                            "drop-shadow-sm"
                        )}
                    >
                        Strakatá Turistika
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="col-span-0 md:col-span-8 lg:col-span-8 hidden w-full md:flex flex-row items-center justify-center">
                    <Navbar textColor={effectiveTheme === "dark" ? "text-white" : textColor} textColorHover={effectiveTheme === "dark" ? "hover:text-gray-200" : textColorHover} />
                </div>

                {/* Authentication buttons */}
                <div className="flex flex-row justify-end col-span-1 md:col-span-2 lg:col-span-2 items-center">
                    <div className="hidden sm:flex flex-row items-center justify-end gap-x-1 sm:gap-x-2 w-full">
                        {!user ? (
                            <div className="flex flex-row items-center justify-end gap-x-1 sm:gap-x-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className={cn(
                                        "rounded-full border font-semibold text-xs sm:text-sm px-2 sm:px-3 transition-all duration-200",
                                        "hover:scale-105",
                                        "bg-gray-900/20 text-gray-900 border-gray-900/30 hover:bg-gray-900/30 hover:border-gray-900/50"
                                    )}
                                    onClick={() => window.location.href = "/auth/login"}
                                >
                                    <span className="hidden sm:inline">Přihlásit se</span>
                                    <span className="sm:hidden">Login</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className={cn(
                                        "rounded-full border font-semibold text-xs sm:text-sm px-2 sm:px-3 transition-all duration-200",
                                        "hover:scale-105",
                                        "bg-gray-900/20 text-gray-900 border-gray-900/30 hover:bg-gray-900/30 hover:border-gray-900/50"
                                    )}
                                    onClick={() => window.location.href = "/auth/register"}
                                >
                                    <span className="hidden sm:inline">Začít</span>
                                    <span className="sm:hidden">Start</span>
                                </Button>
                            </div>
                        ) : (
                            <UserButton role={role} textColor={textColor} />
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="sm:hidden flex items-center justify-center">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "relative flex items-center justify-center p-0 h-10 w-10 rounded-full transition-all duration-200",
                                        "hover:bg-gray-900/10 text-gray-900",
                                        "focus:outline-none"
                                    )}
                                    aria-label="Menu"
                                >
                                    {/* Hamburger blob (mobile only) */}
                                    <span className={cn(
                                        "md:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full -z-10 transition-all duration-300 group-hover:bg-white/80",
                                        (effectiveTheme === "dark" || isTransparentHomeHeader) ? "bg-white/20 backdrop-blur-xl" : "bg-white/50 backdrop-blur-xl"
                                    )} />

                                    <div className="relative w-5 h-5 flex flex-col justify-center items-center gap-1.5">
                                        <motion.span
                                            animate={isMobileMenuOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
                                            transition={{ duration: 0.3, ease: "anticipate" }}
                                            className={cn("w-5 h-0.5 rounded-full origin-center", (effectiveTheme === "dark" || isTransparentHomeHeader) ? "bg-white" : "bg-gray-900")}
                                        />
                                        <motion.span
                                            animate={isMobileMenuOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className={cn("w-5 h-0.5 rounded-full origin-center", (effectiveTheme === "dark" || isTransparentHomeHeader) ? "bg-white" : "bg-gray-900")}
                                        />
                                        <motion.span
                                            animate={isMobileMenuOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
                                            transition={{ duration: 0.3, ease: "anticipate" }}
                                            className={cn("w-5 h-0.5 rounded-full origin-center", (effectiveTheme === "dark" || isTransparentHomeHeader) ? "bg-white" : "bg-gray-900")}
                                        />
                                    </div>
                                </Button>
                            </SheetTrigger>

                            <SheetContent
                                side="right"
                                className="w-full sm:w-[400px] max-w-none p-0 border-none bg-white/90 backdrop-blur-3xl shadow-2xl [&>button]:hidden"
                            >
                                <SheetHeader className="absolute top-0 left-0 w-full p-4 z-50 flex flex-row items-center justify-between border-b border-gray-100/50 bg-white/50 backdrop-blur-sm">
                                    <SheetTitle className="hidden">Hlavní menu</SheetTitle> {/* Accessibility only */}

                                    <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                                        <div className="relative w-8 h-8 mr-3">
                                            <Image
                                                src={basicInfo.img.icons.transparentHeaderOutline}
                                                alt="Logo"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                        <span className="font-bold text-lg text-gray-900 tracking-tight">Strakatá Turistika</span>
                                    </Link>

                                    <SheetClose asChild>
                                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                                            <X className="h-5 w-5 text-gray-500" />
                                            <span className="sr-only">Zavřít</span>
                                        </Button>
                                    </SheetClose>
                                </SheetHeader>

                                <div className="flex flex-col h-full pt-20 pb-6 px-6 overflow-y-auto">
                                    <nav className="flex-1 space-y-8 animate-in slide-in-from-bottom-4 duration-500 delay-100 fade-in">

                                        {/* Main Navigation Group */}
                                        <div className="space-y-4">
                                            <MobileNavLink href="/" active={pathname === "/"} onClick={() => setIsMobileMenuOpen(false)}>
                                                Domů
                                            </MobileNavLink>
                                            <MobileNavLink href="/soutez" active={pathname === "/soutez"} onClick={() => setIsMobileMenuOpen(false)}>
                                                Soutěžit
                                            </MobileNavLink>
                                        </div>

                                        {/* Information Group */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">Informace</h3>
                                            <div className="space-y-1">
                                                <MobileNavLink href="/kontakty" active={pathname === "/kontakty"} secondary onClick={() => setIsMobileMenuOpen(false)}>
                                                    Kontakty
                                                </MobileNavLink>
                                                <MobileNavLink href="/fotogalerie" active={pathname === "/fotogalerie"} secondary onClick={() => setIsMobileMenuOpen(false)}>
                                                    Fotogalerie
                                                </MobileNavLink>
                                                <MobileNavLink href="/pravidla" active={pathname === "/pravidla"} secondary onClick={() => setIsMobileMenuOpen(false)}>
                                                    Pravidla
                                                </MobileNavLink>
                                            </div>
                                        </div>

                                        {/* Results Group */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4">Výsledky</h3>
                                            <div className="space-y-1">
                                                <MobileNavLink href="/vysledky" active={pathname === "/vysledky"} secondary onClick={() => setIsMobileMenuOpen(false)}>
                                                    Přehled výsledků
                                                </MobileNavLink>
                                                <MobileNavLink href="/vysledky/moje" active={pathname === "/vysledky/moje"} secondary onClick={() => setIsMobileMenuOpen(false)}>
                                                    Moje návštěvy
                                                </MobileNavLink>
                                                <MobileNavLink href="/vysledky/statistiky" active={pathname === "/vysledky/statistiky"} secondary onClick={() => setIsMobileMenuOpen(false)}>
                                                    Statistiky
                                                </MobileNavLink>
                                            </div>
                                        </div>
                                    </nav>

                                    {/* Footer / Auth Actions */}
                                    <div className="mt-8 pt-6 border-t border-gray-100/50 animate-in slide-in-from-bottom-4 duration-500 delay-200 fade-in">
                                        {!user ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200 border-0 font-semibold h-12 rounded-xl"
                                                    onClick={() => {
                                                        window.location.href = "/auth/login";
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                >
                                                    Přihlásit se
                                                </Button>
                                                <Button
                                                    className="w-full bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all font-semibold h-12 rounded-xl"
                                                    onClick={() => {
                                                        window.location.href = "/auth/register";
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                >
                                                    Začít
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                                    <UserButton role={role} />
                                                    <div className="mt-3 text-center">
                                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <LogoutButton className="block w-full">
                                                    <Button variant="destructive" className="w-full h-12 rounded-xl font-medium bg-red-50 text-red-600 hover:bg-red-100 border-transparent">
                                                        Odhlásit se
                                                    </Button>
                                                </LogoutButton>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {mode !== "static" && showGap && <div style={{ height: `${headerHeight}px` }}></div>}
        </>
    );
};

// Helper component for mobile nav links
const MobileNavLink = ({
    href,
    children,
    active,
    secondary = false,
    onClick
}: {
    href: string;
    children: React.ReactNode;
    active?: boolean;
    secondary?: boolean;
    onClick?: () => void
}) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "block w-full rounded-xl transition-all duration-200",
                secondary ? "py-2 px-4 text-sm font-medium" : "py-3 px-4 text-base font-semibold",
                active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100"
            )}
        >
            <div className="flex items-center justify-between">
                <span>{children}</span>
                {active && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-1.5 h-1.5 rounded-full bg-blue-600"
                    />
                )}
            </div>
        </Link>
    );
};

export default Header;