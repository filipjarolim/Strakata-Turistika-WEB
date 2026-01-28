"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook } from "lucide-react";
import { ExtendedUser } from "@/next-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const Footer: React.FC<{ user?: ExtendedUser | null; role?: string }> = ({ user }) => {
    return (
        <footer className="bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-[#0a0a0a] border-t border-gray-200/50 dark:border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* Company Info */}
                    <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-2">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Strakatá Turistika</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Objevujte krásy České republiky se svým čtyřnohým parťákem.
                            Sledujte trasy, sdílejte zážitky a soutěžte s ostatními.
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://www.facebook.com/strakata.turistika.7"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <Facebook className="h-5 w-5" />
                            </a>
                            <a
                                href="http://www.spolekstrakacu.cz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors text-sm font-medium flex items-center"
                            >
                                Klub českých strakáčů
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Rychlé odkazy</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    Domů
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    O nás
                                </Link>
                            </li>
                            <li>
                                <Link href="/soutez" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    Soutěžit
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Právní informace</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    Ochrana osobních údajů
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    Podmínky použití
                                </Link>
                            </li>
                            <li>
                                <Link href="/kontakty" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
                                    Kontakty
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* App Download */}
                    <div className="space-y-3 sm:space-y-4">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Aplikace</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.strakataturistika.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors flex items-center gap-2"
                                >
                                    Google Play
                                </a>
                            </li>
                            <li>
                                <span className="text-gray-400 dark:text-gray-600 cursor-not-allowed flex items-center gap-2">
                                    App Store (již brzy)
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-200/50 dark:border-white/10 mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 text-center sm:text-left">
                        © 2025 Strakatá Turistika. Všechna práva vyhrazena.
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;