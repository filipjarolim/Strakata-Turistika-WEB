import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import SupportMePopup from "@/components/structure/SupportMePopup";
import {cn} from "@/lib/utils";
import StatusBlock from "@/components/blocks/StatusBlock";
import { OfflineController } from "@/components/ui/OfflineController";

const CommonPageTemplate = ({
                                children,
                                className,
                                currentUser,
                                currentRole,
                                contents,
                            }: {
    children: React.ReactNode;
    className?: string;
    currentUser?: object;
    currentRole?: string;
    contents?: { complete?: boolean; header?: boolean; footer?: boolean, supportMePopup?: boolean };
}) => {

    return (
        <main className={cn("min-h-screen px-4 sm:px-6 flex flex-col", className)}>
            {(contents?.complete || contents?.header) && <Header user={currentUser} role={currentRole} />}

            {/* Offline status indicator */}
            <div className="fixed top-4 right-4 z-50">
                <OfflineController />
            </div>

            {/*<StatusBlock />*/}
            <div className="flex-grow w-full">
                {children}
            </div>

            {(contents?.complete || contents?.footer) && <Footer user={currentUser} role={currentRole} />}

            {/*<div className="hidden md:block">*/}
            {/*    {(contents.complete || contents.supportMePopup) && <SupportMePopup />}*/}
            {/*</div>*/}
        </main>
    );
};

export default CommonPageTemplate;
