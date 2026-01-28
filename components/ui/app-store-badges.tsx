import Link from "next/link";
import { cn } from "@/lib/utils";

interface BadgeProps {
    className?: string;
    href?: string;
}

export const GooglePlayBadge = ({ className, href = "https://play.google.com/store/apps/details?id=cz.strakata.turistika.strakataturistikaandroidapp" }: BadgeProps) => {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("block hover:scale-105 transition-all duration-300 h-10 sm:h-12", className)}
        >
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Získat na Google Play"
                className="h-full w-auto"
            />
        </Link>
    );
};

export const AppStoreBadge = ({ className, href = "#" }: BadgeProps) => {
    return (
        <Link
            href={href}
            className={cn("block opacity-50 grayscale cursor-not-allowed h-10 sm:h-12", className)}
        >
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="Stáhnout v App Store (již brzy)"
                className="h-full w-auto"
            />
        </Link>
    );
};
