"use client"

import Link from "next/link";

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
        <article>
            {label.message} <Link href={href} className={"text-blue-500 font-semibold"}>{label.link}</Link>
        </article>
    )
}