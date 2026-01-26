import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { LucideIcon, Home, Info, AtSign, Image, FileText, BarChart, List, User, PieChart, Award, Plus, RefreshCw, Calendar } from "lucide-react";
import { motion } from "framer-motion";

type BadgeType = "Nové" | "Aktualizace" | "Událost";

type NavItem = {
    title: string;
    href: string;
    description?: string;
    icon?: LucideIcon;
    badge?: BadgeType;
};

type NavConfigType = {
    type: "roletka" | "odkaz";
    title: string;
    icon?: LucideIcon;
    columns?: number;
    href?: string;
    badge?: BadgeType;
    items?: NavItem[];
}[];

const navConfig: NavConfigType = [
    {
        type: "odkaz",
        title: "Domů",
        icon: Home,
        href: "/",
    },
    {
        type: "roletka",
        title: "Informace",
        icon: Info,
        columns: 1,
        items: [
            {
                title: "Kontakty",
                href: "/kontakty",
                description: "Kontaktní informace na organizátory a správce.",
                icon: AtSign
            },
            {
                title: "Fotogalerie",
                href: "/fotogalerie",
                description: "Fotografie z různých míst a akcí.",
                icon: Image
            },
            {
                title: "Pravidla",
                href: "/pravidla",
                description: "Pravidla účasti a bodování soutěže.",
                icon: FileText
            }
        ]
    },
    {
        type: "roletka",
        title: "Výsledky",
        icon: BarChart,
        columns: 2,
        href: "/vysledky",
        items: [
            {
                title: "Přehled výsledků",
                href: "/vysledky",
                description: "Souhrnný přehled všech výsledků a jejich statistiky.",
                icon: List
            },
            {
                title: "Moje návštěvy",
                href: "/auth/profil",
                description: "Přehled vašich návštěv a dosažených výsledků.",
                icon: User,
                badge: "Nové"
            },
            {
                title: "Statistiky",
                href: "/vysledky/statistiky",
                description: "Podrobné statistiky návštěv a aktivit.",
                icon: PieChart
            }
        ]
    },
    {
        type: "odkaz",
        title: "Soutěžit",
        icon: Award,
        href: "/soutez"
    },
];

interface NavbarProps {
    textColor?: string;
    textColorHover?: string;
}

export const Navbar = ({ textColor = "text-black/80", textColorHover = "hover:text-black" }: NavbarProps) => {
    const pathname = usePathname();

    // Enhanced hover states with proper contrast
    const getHoverStyles = () => ({
        hoverBg: "hover:bg-gray-900/10",
        activeBg: "active:bg-gray-900/20",
        focusBg: "focus:bg-gray-900/10",
        hoverText: "hover:text-gray-900",
        activeText: "active:text-gray-900"
    });

    const hoverStyles = getHoverStyles();

    return (
        <nav className="w-full flex justify-center h-full" style={{ zIndex: 100 }}>
            <NavigationMenu className="max-w-none w-full justify-center h-full">
                <NavigationMenuList className="flex flex-nowrap justify-center gap-x-1 whitespace-nowrap mx-auto h-full">
                    {navConfig.map((navItem, index) => {
                        const isActive = navItem.type === "odkaz" && pathname === navItem.href;

                        return navItem.type === "roletka" ? (
                            <NavigationMenuItem key={index} className="cursor-pointer">
                                <NavigationMenuTrigger
                                    className={cn(
                                        "text-sm transition-all duration-300 ease-out px-4 py-2 rounded-xl",
                                        "bg-white/40 backdrop-blur-xl font-semibold h-full",
                                        "border border-white/50 hover:border-white/80",
                                        textColor,
                                        "hover:bg-white/60 hover:scale-[1.03] active:scale-[0.98]",
                                        "shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]",
                                        hoverStyles.activeBg,
                                        hoverStyles.focusBg,
                                        hoverStyles.hoverText,
                                        hoverStyles.activeText,
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
                                        navItem.badge && "group"
                                    )}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {navItem.icon && (
                                            <Icon
                                                icon={navItem.icon}
                                                className={cn(
                                                    "w-4 h-4 transition-opacity duration-200",
                                                    "opacity-70 group-hover:opacity-100"
                                                )}
                                            />
                                        )}
                                        <span>{navItem.title}</span>
                                        {navItem.badge && (
                                            <StyledBadge type={navItem.badge} className="ml-1" />
                                        )}
                                    </div>
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <div className={cn(
                                        "min-w-[400px] w-max max-w-[calc(100vw-40px)] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/40 bg-white/80 backdrop-blur-2xl",
                                        "animate-in fade-in zoom-in-95 duration-300"
                                    )}>
                                        <ul className={cn("grid gap-1.5 p-4 w-full", `grid-cols-${navItem.columns || 1}`)}>
                                            {navItem.items?.map((item, i) => (
                                                <ListItem
                                                    key={i}
                                                    title={item.title}
                                                    href={item.href}
                                                    icon={item.icon}
                                                    badge={item.badge}
                                                >
                                                    {item.description}
                                                </ListItem>
                                            ))}
                                        </ul>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        ) : (
                            <NavigationMenuItem key={index} className="cursor-pointer">
                                <NavigationMenuLink asChild>
                                    <Link href={navItem.href as string}>
                                        <div
                                            className={cn(
                                                "flex items-center gap-1.5 text-sm transition-all duration-300 ease-out px-4 py-2 rounded-xl h-full backdrop-blur-xl font-semibold",
                                                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]",
                                                isActive
                                                    ? "bg-white/60 text-gray-950 border border-white/80 scale-[1.03]"
                                                    : cn(textColor, "bg-white/40 hover:bg-white/60 border border-white/50 hover:border-white/80 hover:scale-[1.03] active:scale-[0.98]", hoverStyles.activeBg, hoverStyles.hoverText, hoverStyles.activeText)
                                            )}
                                        >
                                            {navItem.icon && (
                                                <Icon
                                                    icon={navItem.icon}
                                                    className={cn(
                                                        "w-4 h-4 transition-opacity duration-200",
                                                        isActive ? "opacity-100" : "opacity-70"
                                                    )}
                                                />
                                            )}
                                            <span>{navItem.title}</span>
                                            {navItem.badge && <StyledBadge type={navItem.badge} className="ml-1" />}
                                        </div>
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        );
                    })}
                </NavigationMenuList>
            </NavigationMenu>
        </nav>
    );
};

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { icon?: LucideIcon; badge?: BadgeType }
>(({ className, title, children, icon, badge, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={props.href ?? "#"}
                    ref={ref}
                    className={cn(
                        "group flex flex-col gap-2 rounded-xl p-3.5 transition-all duration-300 ease-out",
                        "hover:bg-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-[1.02]",
                        "border border-transparent hover:border-white/60",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
                        className
                    )}
                    {...props}
                >
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100/50 group-hover:bg-white group-hover:shadow-sm transition-all duration-300 border border-transparent group-hover:border-gray-200/50">
                                <Icon icon={icon} className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                            </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">{title}</span>
                                {badge && <StyledBadge type={badge} />}
                            </div>
                            {children && (
                                <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-200">{children}</p>
                            )}
                        </div>
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    );
});

const StyledBadge = ({ type, className }: { type: BadgeType; className?: string }) => {
    const badgeConfig = {
        Nové: { color: "bg-emerald-100 text-emerald-700", icon: Plus },
        Aktualizace: { color: "bg-blue-100 text-blue-700", icon: RefreshCw },
        Událost: { color: "bg-amber-100 text-amber-700", icon: Calendar }
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1",
                badgeConfig[type].color,
                className
            )}
        >
            <Icon icon={badgeConfig[type].icon} className="w-2.5 h-2.5" />
            {type}
        </Badge>
    );
};

ListItem.displayName = "ListItem";