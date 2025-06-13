import React from "react";
import Header from "@/components/structure/Header";
import Footer from "@/components/structure/Footer";
import SupportMePopup from "@/components/structure/SupportMePopup";
import {cn} from "@/lib/utils";
import StatusBlock from "@/components/blocks/StatusBlock";
import Image from "next/image"
import FooterDog from "@/assets/img/footerdog.png";
import { ExtendedUser } from "@/next-auth";

const CommonPageTemplate = ({
                                children,
                                className,
                                currentUser,
                                currentRole,
                                contents,
                                style
                            }: {
    children: React.ReactNode;
    className?: string;
    currentUser?: ExtendedUser | null;
    currentRole?: string;
    contents?: { complete?: boolean; header?: boolean; footer?: boolean, supportMePopup?: boolean };
    style?: React.CSSProperties;
}) => {

    return (
        <>
        <main className={cn("min-h-screen w-full flex flex-col px-4", className)} style={style}>
            {(contents?.complete || contents?.header) && <Header user={currentUser} role={currentRole} />}



            {/*<StatusBlock />*/}
            <div className="flex-grow w-full">
                {children}
            </div>

            {(contents?.complete || contents?.footer) && <Footer user={currentUser} role={currentRole} />}

            {/*<div className="hidden md:block">*/}
            {/*    {(contents.complete || contents.supportMePopup) && <SupportMePopup />}*/}
            {/*</div>*/}
        </main>
        {(contents?.complete || contents?.footer) && <Image src={FooterDog} alt="Strakatá turistika" className={"w-full mt-[-110px] pointer-events-none "}/>}
            

        </>
    );
};

export default CommonPageTemplate;
