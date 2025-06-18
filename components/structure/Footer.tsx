"use client";

import React, { useEffect, useState, useCallback } from "react";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSDropdownMenu, IOSDropdownMenuItem } from "@/components/ui/ios/dropdown-menu";
import basicInfo from "@/lib/settings/basicInfo";
import { ExternalLink, Facebook, MessageSquare } from "lucide-react";
import { ExtendedUser } from "@/next-auth";

const Footer: React.FC<{ user?: ExtendedUser | null; role?: string }> = ({ user }) => {
    const navLinks = [
        { name: "O nás", href: "/about" },
        { name: "Služby", href: "/services" },
        { name: "Kontakt", href: "/contact" },
        { name: "Zásady ochrany osobních údajů", href: "/privacy" },
    ];

    const socialLinks = [
        { name: "Facebook", href: "https://www.facebook.com/strakata.turistika.7", icon: <Facebook className="w-5 h-5" /> },
    ];

    return (
        <footer className="w-full bg-transparent mt-auto pb-4 pt-8" style={{ position: 'relative', zIndex: 1 }}>
            <div className="w-full px-0">
                <IOSCard variant="elevated" className="w-full mx-0 p-0 bg-white/80 backdrop-blur-xl border-0 shadow-xl" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 px-4 md:px-8 relative">
                        {/* Brand/Info */}
                        <div className="flex flex-col space-y-4 items-start relative">
                            <IOSBadge label={basicInfo.name} size={40} className="mb-2" />
                            <span className="text-sm text-blue-900/70 font-medium">{basicInfo.description}</span>
                            <span className="text-xs text-blue-900/50 mt-2">Průvodce pro milovníky strakatých psů a turistiky po České republice.</span>
                        </div>

                        {/* Navigation - iOS Dropdown on mobile, list on desktop */}
                        <div className="flex flex-col space-y-4 relative">
                            <span className="text-base font-semibold text-blue-900">Rychlé odkazy</span>
                            <div className="block md:hidden">
                                <IOSDropdownMenu
                                    trigger={<IOSButton variant="outline" size="md" className="w-full">Zobrazit odkazy</IOSButton>}
                                    align="left"
                                >
                                    {navLinks.map(({ name, href }) => (
                                        <IOSDropdownMenuItem key={name} onClick={() => window.location.href = href}>
                                            {name}
                                        </IOSDropdownMenuItem>
                                    ))}
                                </IOSDropdownMenu>
                            </div>
                            <nav className="hidden md:flex flex-col space-y-2">
                                {navLinks.map(({ name, href }) => (
                                    <a
                                        key={name}
                                        href={href}
                                        className="text-sm text-blue-900/70 hover:text-blue-900 transition-colors duration-200 flex items-center gap-1 group relative"
                                    >
                                        <span className="underline-offset-4 group-hover:underline">{name}</span>
                                    </a>
                                ))}
                            </nav>
                        </div>

                        {/* Social Links - iOSCircleIcon */}
                        <div className="flex flex-col space-y-4 relative">
                            <span className="text-base font-semibold text-blue-900">Sledujte nás</span>
                            <div className="flex flex-row gap-4 mt-2">
                                {socialLinks.map(({ name, href, icon }) => (
                                    <a
                                        key={name}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative"
                                        aria-label={name}
                                    >
                                        <IOSCircleIcon variant="blue" size="md" className="shadow-md hover:scale-110 transition-transform">
                                            {icon}
                                        </IOSCircleIcon>
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* System Info */}
                        <div className="flex flex-col space-y-4 relative">
                            <span className="text-base font-semibold text-blue-900">Informace o systému</span>
                            <span className="text-sm text-blue-900/70">Aktuální uživatel: {user?.email || "Host"}</span>
                            <IOSButton variant="outline" size="md" className="w-full flex items-center justify-center gap-2 mt-2">
                                <MessageSquare className="h-4 w-4" />
                                Zpětná vazba
                            </IOSButton>
                        </div>
                    </div>
                    <div className="border-t border-gray-200/60 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/60 rounded-b-2xl relative">
                        <span className="text-xs text-blue-900/60">© 2025 {basicInfo.name}. Všechna práva vyhrazena.</span>
                        <a
                            href="https://github.com/filipjarolim"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary cursor-pointer hover:underline transition-all duration-300 flex items-center gap-1 relative"
                        >
                            Web vytvořil <strong>@filipjarolim</strong>
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </div>
                </IOSCard>
            </div>
        </footer>
    );
};

export default Footer;