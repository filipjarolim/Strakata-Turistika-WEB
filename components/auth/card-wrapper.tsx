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
        <Card className={"w-[90%] md:w-[80%] border-0 shadow-none bg-transparent"}>
            <CardHeader>
               <BackButton label={backButtonLabel} href={backButtonHref} />
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>



        </Card>
    )
}