"use client"

import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import {cn} from "@/lib/utils";
import Image from "next/image"
import FooterDog from "@/assets/img/footerdog.png";
import { ExtendedUser } from "@/next-auth";
import { BugReportPanel } from "@/components/bug-report/BugReportPanel";

const CommonPageTemplate = ({
    children,
    className,
    currentUser,
    currentRole,
    contents,
    style,
    headerMode = "fixed"
}: {
    children: React.ReactNode;
    className?: string;
    currentUser?: ExtendedUser | null;
    currentRole?: string;
    contents?: { complete?: boolean; header?: boolean; footer?: boolean };
    style?: React.CSSProperties;
    headerMode?: "fixed" | "static" | "auto-hide";
}) => {
    return (
        <>
            <main className={cn("min-h-screen w-full flex flex-col px-4", className)} style={style}>
                {(contents?.complete || contents?.header) && <Header user={currentUser} role={currentRole} mode={headerMode} />}
                <div className="flex-grow w-full">{children}</div>
                {(contents?.complete || contents?.footer) && <Footer user={currentUser} role={currentRole} />}
            </main>

            <BugReportPanel currentUser={currentUser} currentRole={currentRole} />

            {(contents?.complete || contents?.footer) && (
                <Image 
                    src={FooterDog} 
                    alt="Strakatá turistika" 
                    className="w-full mt-[-110px] pointer-events-none"
                />
            )}
        </>
    );
};

export default CommonPageTemplate;
