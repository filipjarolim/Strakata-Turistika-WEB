import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import SupportMePopup from "@/components/structure/SupportMePopup";
import {cn} from "@/lib/utils";

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
    contents: { complete?: boolean; header?: boolean; footer?: boolean, supportMePopup?: boolean };
}) => {

    return (
        <main className={cn("min-h-screen p-4 sm:p-6 flex flex-col items-start justify-start relative", className)}>


            {(contents.complete || contents.header) && <Header user={currentUser} role={currentRole} />}
            {currentRole}
            {children}

            {(contents.complete || contents.footer) && <Footer user={currentUser} role={currentRole} />}
            {(contents.complete || contents.supportMePopup) && <SupportMePopup />}

        </main>
    );
};

export default CommonPageTemplate;
