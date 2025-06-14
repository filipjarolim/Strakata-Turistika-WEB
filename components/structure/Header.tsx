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
import { cn } from "@/lib";
import { RegisterButton } from "../auth/register-button";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ExtendedUser } from "@/next-auth";

const Header = ({
                    user,
                    role,
                    mode = "fixed"
                }: {
    user?: ExtendedUser | null;
    role?: string;
    mode?: "fixed" | "static" | "auto-hide";
}) => {
    const headerRef = useRef<HTMLElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);
    const [isScrolled, setIsScrolled] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const [lastScrollY, setLastScrollY] = useState<number>(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

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

    return (
        <>
            <header
                ref={headerRef}
                className={cn(
                    "grid grid-cols-3 select-none md:grid-cols-12 w-full md:w-[90%] mx-auto px-4 py-3 rounded-b-xl h-fit",
                    mode !== "static" && "fixed left-1/2 translate-x-[-50%]",
                    isScrolled ? "md:w-[95%] shadow-md backdrop-blur-lg bg-white/80" : "bg-white/70 backdrop-blur-md",
                    "transition-all duration-300",
                    mode === "auto-hide" && !isVisible && "-translate-y-[100%]"
                )}
                style={{ 
                    zIndex: 50,
                    ...(mode === "auto-hide" && !isVisible && { boxShadow: "none" })
                }}
            >
                <Link
                    href="/"
                    className="flex flex-row items-center justify-start col-span-2 md:col-span-2 lg:col-span-2 text-[18px] font-bold text-black/80 transition-all duration-200 hover:text-black"
                >
                    <Image
                        src={basicInfo.img.icons.transparentHeaderOutline}
                        alt="Logo"
                        width={32}
                        height={32}
                        className="mr-2 transition-transform duration-300 hover:scale-110"
                    />
                    <span className="hidden sm:inline">Strakatá Turistika</span>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="col-span-0 md:col-span-8 lg:col-span-8 hidden w-full md:flex flex-row items-center justify-center">
                    <Navbar />
                </div>
                
                {/* Authentication buttons */}
                <div className="flex flex-row justify-end col-span-1 md:col-span-2 lg:col-span-2 items-center">
                    <div className="hidden md:flex flex-row items-center justify-end gap-x-2 w-full">
                        {!user ? (
                            <div className="flex flex-row items-center justify-end gap-x-2">
                                <LoginButton>Přihlásit se</LoginButton>
                                <RegisterButton>Začít</RegisterButton>
                            </div>
                        ) : (
                            <UserButton />
                        )}
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="p-1 h-9 w-9 rounded-full hover:bg-gray-100"
                                    aria-label="Menu"
                                >
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
                                className="w-[85%] max-w-sm p-0 border-none"
                            >
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
                                                <UserButton />
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

            {mode !== "static" && <div style={{height: `${headerHeight}px`}}></div>}
        </>
    );
};

export default Header;