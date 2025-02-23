import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import SupportMePopup from "@/components/structure/SupportMePopup";
import {cn} from "@/lib/utils";
import StatusBlock from "@/components/blocks/StatusBlock";
import OfflinePagesList from "../pwa/OfflinePagesList";

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
        <main className={cn("min-h-screen  px-4 sm:px-6 flex flex-col items-start justify-start relative", className)}>


            {(contents?.complete || contents?.header) && <Header user={currentUser} role={currentRole} />}
            <OfflinePagesList />

            {/*<StatusBlock />*/}
            {children}

            {(contents?.complete || contents?.footer) && <Footer user={currentUser} role={currentRole} />}

            {/*<div className="hidden md:block">*/}
            {/*    {(contents.complete || contents.supportMePopup) && <SupportMePopup />}*/}
            {/*</div>*/}
        </main>
    );
};

export default CommonPageTemplate;
