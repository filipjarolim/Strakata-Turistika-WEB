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
// Removed dynamic background detection to keep header consistently light

const Header = ({
                    user,
                    role,
                    mode = "fixed",
                    showGap = true
                }: {
    user?: ExtendedUser | null;
    role?: string;
    mode?: "fixed" | "static" | "auto-hide";
    showGap?: boolean;
}) => {
    const headerRef = useRef<HTMLElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isMobile = useIsMobile();

    // Fixed light styling (no background detection)
    const textColor = "text-gray-900";
    const textColorHover = "hover:text-gray-700";

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
                if (currentScrollY > lastScrollY) {
                    // Scrolling down
                    setIsVisible(false);
                } else {
                    // Scrolling up
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
                background: 'rgba(255, 255, 255, 0.90)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.03)'
            };
        }
        return {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
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
                    className="flex flex-row items-center justify-start col-span-2 md:col-span-2 lg:col-span-2 relative"
                >
                    {/* Title blob (mobile only) */}
                    <span className="md:hidden absolute -top-1 -left-1 w-8 h-8 bg-white/50 backdrop-blur-xl rounded-full -z-10" />
                    <span 
                        className={cn(
                            "text-[16px] sm:text-[18px] md:text-[22px] font-bold tracking-tight transition-colors duration-200",
                            textColor,
                            "drop-shadow-sm"
                        )}
                    >
                        <span className="hidden sm:inline">Strakatá Turistika</span>
                        <span className="sm:hidden">ST</span>
                    </span>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="col-span-0 md:col-span-8 lg:col-span-8 hidden w-full md:flex flex-row items-center justify-center">
                    <Navbar textColor={textColor} textColorHover={textColorHover} />
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
                    <div className="sm:hidden flex items-center">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={cn(
                                        "relative overflow-visible p-1 h-9 w-9 rounded-full transition-all duration-200",
                                        "hover:scale-105",
                                        "hover:bg-gray-900/10 text-gray-900"
                                    )}
                                    aria-label="Menu"
                                >
                                    {/* Hamburger blob (mobile only) */}
                                    <span className="md:hidden absolute -top-1 -right-1 w-8 h-8 bg-white/50 backdrop-blur-xl rounded-full -z-10" />
                                    <AnimatePresence mode="wait" initial={false}>
                                        {isMobileMenuOpen ? (
                                            <motion.div
                                                key="close"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <X className="h-5 w-5" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="menu"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Menu className="h-5 w-5" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </SheetTrigger>

                            <SheetContent
                                side="right"
                                className="w-[90%] max-w-sm p-0 border-none"
                            >
                                <SheetHeader>
                                    <SheetTitle className="sr-only">Hlavní menu</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between p-4 border-b">
                                        <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
                                            <Image
                                                src={basicInfo.img.icons.transparentHeaderOutline}
                                                alt="Logo"
                                                width={24}
                                                height={24}
                                                className="mr-2"
                                            />
                                            <span className="font-semibold">Strakatá Turistika</span>
                                        </Link>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto py-4 px-5">
                                        <nav className="space-y-4">
                                            <Link 
                                                href="/" 
                                                className={cn(
                                                    "block py-2 px-3 rounded-md transition-colors",
                                                    pathname === "/" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                )}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                Domů
                                            </Link>
                                            <div>
                                                <h3 className="font-medium mb-2 px-3">Informace</h3>
                                                <div className="space-y-2 pl-2">
                                                    <Link 
                                                        href="/kontakty" 
                                                        className={cn(
                                                            "block py-1.5 px-3 rounded-md transition-colors text-sm",
                                                            pathname === "/kontakty" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                        )}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        Kontakty
                                                    </Link>
                                                    <Link 
                                                        href="/fotogalerie" 
                                                        className={cn(
                                                            "block py-1.5 px-3 rounded-md transition-colors text-sm",
                                                            pathname === "/fotogalerie" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                        )}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        Fotogalerie
                                                    </Link>
                                                    <Link 
                                                        href="/pravidla" 
                                                        className={cn(
                                                            "block py-1.5 px-3 rounded-md transition-colors text-sm",
                                                            pathname === "/pravidla" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                        )}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        Pravidla
                                                    </Link>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-medium mb-2 px-3">Výsledky</h3>
                                                <div className="space-y-2 pl-2">
                                                    <Link 
                                                        href="/vysledky" 
                                                        className={cn(
                                                            "block py-1.5 px-3 rounded-md transition-colors text-sm",
                                                            pathname === "/vysledky" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                        )}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        Přehled výsledků
                                                    </Link>
                                                    <Link 
                                                        href="/vysledky/moje" 
                                                        className={cn(
                                                            "block py-1.5 px-3 rounded-md transition-colors text-sm",
                                                            pathname === "/vysledky/moje" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                        )}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        Moje návštěvy
                                                    </Link>
                                                    <Link 
                                                        href="/vysledky/statistiky" 
                                                        className={cn(
                                                            "block py-1.5 px-3 rounded-md transition-colors text-sm",
                                                            pathname === "/vysledky/statistiky" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                        )}
                                                        onClick={() => setIsMobileMenuOpen(false)}
                                                    >
                                                        Statistiky
                                                    </Link>
                                                </div>
                                            </div>
                                            <Link 
                                                href="/soutez" 
                                                className={cn(
                                                    "block py-2 px-3 rounded-md transition-colors",
                                                    pathname === "/soutez" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                                )}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                            Soutěžit
                                        </Link>
                                        </nav>
                                    </div>
                                    
                                    <div className="p-4 border-t">
                                        {!user ? (
                                            <div className="flex flex-col gap-3">
                                                <LoginButton>Přihlásit se</LoginButton>
                                                <RegisterButton>Začít</RegisterButton>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <UserButton role={role} />
                                                <LogoutButton className="mt-2 block w-full">
                                                    <Button variant="outline" className="w-full">
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

            {mode !== "static" && showGap && <div style={{height: `${headerHeight}px`}}></div>}
        </>
    );
};

export default Header;