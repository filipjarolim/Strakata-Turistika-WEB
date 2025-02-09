"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import basicInfo from "@/lib/settings/basicInfo";

const Footer: React.FC<{ user?: { email?: string }; role?: string }> = ({ user }) => {
    const navLinks = [
        { name: "O nás", href: "/about" },
        { name: "Služby", href: "/services" },
        { name: "Kontakt", href: "/contact" },
        { name: "Zásady ochrany osobních údajů", href: "/privacy" },
    ];

    return (
        <footer className="w-full mt-auto bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <Separator />

            <div className="container mx-auto px-4 md:px-8 py-10">
                {/* Footer Top Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Left Section: Company Info */}
                    <div className="flex flex-col space-y-4">
                        <h2 className="text-lg font-semibold">{basicInfo.name}</h2>
                        <p className="text-sm text-muted-foreground">{basicInfo.description}</p>
                    </div>

                    {/* Middle Section: Navigation */}
                    <div className="flex flex-col space-y-4">
                        <h2 className="text-lg font-semibold">Rychlé odkazy</h2>
                        <nav className="flex flex-col space-y-2">
                            {navLinks.map(({ name, href }) => (
                                <a
                                    key={name}
                                    href={href}
                                    className="text-sm text-muted-foreground underline-offset-4 focus:underline focus:outline-none"
                                >
                                    {name}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Right Section: System Info */}
                    <div className="flex flex-col space-y-4">
                        <h2 className="text-lg font-semibold">Informace o systému</h2>
                        <p className="text-sm text-muted-foreground">
                            Aktuální uživatel: {user?.email || "Host"}
                        </p>
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
              <span className="text-primary cursor-pointer">
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
    );
};

export default Footer;