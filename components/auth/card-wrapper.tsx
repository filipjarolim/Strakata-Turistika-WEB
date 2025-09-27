"use client"

import {
    Card,
    CardContent,
    CardHeader,
    CardFooter
} from "@/components/ui/card";

import {BackButton} from "@/components/auth/back-button";
import {Separator} from "@/components/ui/separator";

interface CardWrapperProps {
    children: React.ReactNode;
    backButtonLabel: {
        message: string,
        link: string
    };
    backButtonHref: string;
};

export const CardWrapper = ({
    children,
    backButtonLabel,
    backButtonHref
}: CardWrapperProps) => {
    return (
        <Card className={"w-full max-w-md mx-auto border-0 shadow-none bg-transparent"}>
            <CardHeader className="px-0 sm:px-6">
               <BackButton label={backButtonLabel} href={backButtonHref} />
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
                {children}
            </CardContent>



        </Card>
    )
}