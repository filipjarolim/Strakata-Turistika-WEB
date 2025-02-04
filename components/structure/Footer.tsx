"use client";

import React from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import basicInfo from "@/lib/settings/basicInfo";

const Footer: React.FC<{ user?: { email?: string }; role?: string }> = ({ user }) => {


    const navLinks = [
        { name: "About Us", href: "/about" },
        { name: "Services", href: "/services" },
        { name: "Contact", href: "/contact" },
        { name: "Privacy Policy", href: "/privacy" },
    ];

    return (
        <footer className="w-full mt-auto bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
            <Separator />

            <div className="container px-4 md:px-8 py-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">

                    {/* Left Section - Company Info */}
                    <Card className="bg-muted/40 border-none shadow-none">
                        <CardHeader>
                            <CardTitle>{basicInfo.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{basicInfo.description}</p>
                        </CardContent>
                    </Card>

                    {/* Middle Section - Navigation */}
                    <Card className="bg-muted/40 border-none shadow-none">
                        <CardHeader>
                            <CardTitle>Quick Links</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <nav className="flex flex-col space-y-2">
                                {navLinks.map(({ name, href }) => (
                                    <Button
                                        key={name}
                                        variant="link"
                                        className="text-muted-foreground hover:text-foreground p-0 h-auto text-left"
                                        asChild
                                    >
                                        <a href={href}>{name}</a>
                                    </Button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Right Section - System Info */}
                    <Card className="bg-muted/40 border-none shadow-none">
                        <CardHeader>
                            <CardTitle>System Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                <p>Current User: {user?.email || "Guest"}</p>
                  
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Bottom Section */}
                <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2025 {basicInfo.name}. Všechna práva vyhrazena.
                    </p>

                    {/* GitHub Author Section */}
                    <HoverCard>
                        <HoverCardTrigger>
                            <span className="text-primary hover:underline cursor-pointer">
                                    Web vytvořil <strong>@filipjarolim</strong>
                                  </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64">
                            <p className="text-sm">        Tento projekt byl navržen a vyvinut <strong>@filipjarolim</strong>, se zaměřením na přístupnost a výkon.</p>
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
