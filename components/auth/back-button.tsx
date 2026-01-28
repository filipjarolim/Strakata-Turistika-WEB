"use client"

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    label: {
        message: string,
        link: string
    };
    href: string;
}

export const BackButton = ({
    label,
    href
}: BackButtonProps) => {
    return (
        <p className="text-sm text-gray-800 dark:text-gray-300 font-medium">
            {label.message}{" "}
            <Link
                href={href}
                className={cn(
                    "text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4 transition-all"
                )}
            >
                {label.link}
            </Link>
        </p>
    )
}