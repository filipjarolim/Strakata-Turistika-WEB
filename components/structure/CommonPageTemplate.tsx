"use client"

import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import {cn} from "@/lib/utils";
import Image from "next/image"
import FooterDog from "@/assets/img/footerdog.png";
import { ExtendedUser } from "@/next-auth";
import { BugReportPanel } from "@/components/bug-report/BugReportPanel";
import { OfflineController } from "@/components/ui/OfflineController";
import { ScrollArea } from "@/components/ui/scroll-area";

const CommonPageTemplate = ({
    children,
    className,
    currentUser,
    currentRole,
    contents,
    style,
    headerMode = "fixed",
    showOfflineController = false,
    mobileLayout = false
}: {
    children: React.ReactNode;
    className?: string;
    currentUser?: ExtendedUser | null;
    currentRole?: string;
    contents?: { complete?: boolean; header?: boolean; footer?: boolean };
    style?: React.CSSProperties;
    headerMode?: "fixed" | "static" | "auto-hide";
    showOfflineController?: boolean;
    mobileLayout?: boolean;
}) => {
    return (
        <>
            <main className={cn("min-h-screen w-full flex flex-col px-4", className)} style={style}>
                {(contents?.complete || contents?.header) && <Header user={currentUser} role={currentRole} mode={headerMode} />}
                <div className="flex-grow w-full">
                    {mobileLayout ? (
                        <div className="h-screen max-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                            {/* Mobile layout (no border, full width) */}
                            <div className="md:hidden w-full h-full bg-white/80 backdrop-blur-xl overflow-y-auto">
                                {children}
                            </div>

                            {/* Desktop layout (phone-like design with border) */}
                            <div className="hidden md:block mx-auto max-w-sm w-full h-full max-h-screen bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-8 border-gray-800 overflow-hidden">
                                <ScrollArea className="h-full w-full p-4">
                                    {children}
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        children
                    )}
                </div>
                {(contents?.complete || contents?.footer) && <Footer user={currentUser} role={currentRole} />}
            </main>

            <BugReportPanel currentUser={currentUser} currentRole={currentRole} />

            {/* Offline Controller - Fixed position like bug report */}
            {showOfflineController && <OfflineController />}

            {(contents?.complete || contents?.footer) && (
                <div className="relative" style={{ zIndex: 2, pointerEvents: 'none', userSelect: 'none' }}>
                    <Image 
                        src={FooterDog} 
                        alt="Strakatá turistika" 
                        className="w-full mt-[-110px] pointer-events-none"
                    />
                </div>
            )}
        </>
    );
};

export default CommonPageTemplate;
