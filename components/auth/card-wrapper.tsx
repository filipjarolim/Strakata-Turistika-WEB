"use client"

import {
    Card,
    CardContent,
    CardHeader,
    CardFooter
} from "@/components/ui/card";
import {Header} from "@/components/auth/header";
import {Social} from "@/components/auth/social";
import {BackButton} from "@/components/auth/back-button";
import {Separator} from "@/components/ui/separator";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
    backButtonLabel: {
        message: string,
        link: string
    };
    backButtonHref: string;
    showSocial?: boolean;
};

export const CardWrapper = ({
    children,
    headerLabel,
    backButtonLabel,
    backButtonHref,
    showSocial
}: CardWrapperProps) => {
    return (
        <Card className={"w-[600px] border-0 shadow-none bg-transparent"}>
            <CardHeader>
               <Header label={headerLabel} />
               <BackButton label={backButtonLabel} href={backButtonHref} />
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>


            {showSocial && (
                <>
                    <div
                        className={"grid grid-cols-3 mx-8 mb-4 font-semibold text-[12px] text-[#666] place-items-center"}
                        style={{gridTemplateColumns: "1fr 40px 1fr"}}>
                        <Separator className={"w-full"}/>
                        <div>
                            OR
                        </div>
                        <Separator/>
                    </div>
                    <CardFooter>
                        <Social />
                    </CardFooter>

                </>
                )}
        </Card>
    )
}