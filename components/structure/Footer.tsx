"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import basicInfo from "@/lib/settings/basicInfo";
import { ExternalLink, ArrowUp, MessageSquare } from "lucide-react";

const Footer: React.FC<{ user?: { email?: string }; role?: string }> = ({ user }) => {
    const [showBackToTop, setShowBackToTop] = useState(false);
    
    // Handle scroll detection for back-to-top button
    const handleScroll = useCallback(() => {
        const currentScrollPosition = window.scrollY;
        // Show back to top button when scrolled down more than 500px
        setShowBackToTop(currentScrollPosition > 500);
    }, []);
    
    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };
    
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const navLinks = [
        { name: "O nás", href: "/about" },
        { name: "Služby", href: "/services" },
        { name: "Kontakt", href: "/contact" },
        { name: "Zásady ochrany osobních údajů", href: "/privacy" },
    ];
    
    const socialLinks = [
        { name: "Instagram", href: "https://instagram.com" },
        { name: "Facebook", href: "https://facebook.com" },
        { name: "YouTube", href: "https://youtube.com" }
    ];

    return (
        <>
            {/* Back to top button */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button 
                            onClick={scrollToTop}
                            className={`fixed z-50 bottom-4 right-4 p-2 bg-secondary text-secondary-foreground rounded-full shadow-md transition-all duration-300 hover:scale-105 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                            aria-label="Zpět nahoru"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Zpět nahoru</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        
            <footer className="w-full bg-white shadow-lg mt-auto">
                <Separator />

                <div className="container mx-auto px-4 md:px-8 py-8">
                    {/* Footer Top Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Company Info */}
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg font-semibold">{basicInfo.name}</h2>
                            <p className="text-sm text-muted-foreground">{basicInfo.description}</p>
                            <p className="text-sm mt-4">
                                Průvodce pro milovníky strakatých psů a turistiky po České republice.
                            </p>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg font-semibold">Rychlé odkazy</h2>
                            <nav className="flex flex-col space-y-2">
                                {navLinks.map(({ name, href }) => (
                                    <a
                                        key={name}
                                        href={href}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1 group"
                                    >
                                        <span className="underline-offset-4 group-hover:underline">{name}</span>
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Social Links */}
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg font-semibold">Sledujte nás</h2>
                            <nav className="flex flex-col space-y-2">
                                {socialLinks.map(({ name, href }) => (
                                    <a
                                        key={name}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1 group"
                                    >
                                        <span className="underline-offset-4 group-hover:underline">{name}</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 duration-300" />
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* System Info */}
                        <div className="flex flex-col space-y-4">
                            <h2 className="text-lg font-semibold">Informace o systému</h2>
                            <p className="text-sm text-muted-foreground">
                                Aktuální uživatel: {user?.email || "Host"}
                            </p>
                            <div className="mt-4">
                                <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Zpětná vazba
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Separator between Top and Bottom */}
                    <Separator className="my-6" />

                    {/* Footer Bottom Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
                        <p className="text-sm text-muted-foreground">
                            © 2025 {basicInfo.name}. Všechna práva vyhrazena.
                        </p>

                        <HoverCard>
                            <HoverCardTrigger>
                                <span className="text-primary cursor-pointer hover:underline transition-all duration-300">
                                    Web vytvořil <strong>@filipjarolim</strong>
                                </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="max-w-xs">
                                <p className="text-sm">
                                    Tento projekt byl navržen a vyvinut <strong>@filipjarolim</strong>, se zaměřením na
                                    přístupnost a výkon.
                                </p>
                                <Button variant="outline" className="mt-3 w-full" asChild>
                                    <a href="https://github.com/filipjarolim" target="_blank" rel="noopener noreferrer">
                                        Zobrazit GitHub Profil
                                    </a>
                                </Button>
                            </HoverCardContent>
                        </HoverCard>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default Footer;