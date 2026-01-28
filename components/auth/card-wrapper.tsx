"use client"

import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";

import { BackButton } from "@/components/auth/back-button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CardWrapperProps {
    children: React.ReactNode;
    backButtonLabel: {
        message: string,
        link: string
    };
    backButtonHref: string;
    showSocial?: boolean;
    headerIcon?: React.ReactNode;
    title?: string;
    subtitle?: string;
};

export const CardWrapper = ({
    children,
    backButtonLabel,
    backButtonHref,
    title,
    subtitle,
    headerIcon
}: CardWrapperProps) => {
    return (
        <div className="w-full max-w-md mx-auto">
            <Card className={cn(
                "border-white/20 dark:border-white/10 shadow-2xl bg-white/40 dark:bg-black/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden"
            )}>
                {(title || subtitle || headerIcon) && (
                    <CardHeader className="pt-10 px-8 pb-0 text-center space-y-4">
                        {headerIcon && (
                            <div className="flex justify-center">
                                <div className="p-4 bg-white/50 dark:bg-white/10 rounded-2xl shadow-xl shadow-black/5">
                                    {headerIcon}
                                </div>
                            </div>
                        )}
                        <div className="space-y-1.5">
                            {title && (
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </CardHeader>
                )}
                <CardContent className="p-8">
                    {children}
                </CardContent>
            </Card>

            <div className="mt-8 text-center animate-fadeIn">
                <BackButton label={backButtonLabel} href={backButtonHref} />
            </div>
        </div>
    )
}