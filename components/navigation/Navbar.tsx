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
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { LucideIcon, Home, Info, AtSign, Image, FileText, BarChart, List, User, PieChart, Award } from "lucide-react";

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
    className?: string;
}

export const Navbar = ({ className }: NavbarProps) => {
    const pathname = usePathname();

    const triggerBaseClasses = "group inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 outline-none";
    const itemIdleClasses = "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/10";
    const itemActiveClasses = "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";

    return (
        <div className={cn("flex justify-center", className)}>
            <NavigationMenu className="max-w-none">
                <NavigationMenuList className="flex items-center gap-1.5 p-1 bg-white/30 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-sm">
                    {navConfig.map((navItem, index) => {
                        const isActive = navItem.type === "odkaz" && pathname === navItem.href;

                        if (navItem.type === "roletka") {
                            return (
                                <NavigationMenuItem key={index}>
                                    <NavigationMenuTrigger className={cn(triggerBaseClasses, itemIdleClasses, "data-[state=open]:bg-white/50 dark:data-[state=open]:bg-white/10")}>
                                        <div className="flex items-center gap-2">
                                            {navItem.icon && <navItem.icon size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
                                            <span>{navItem.title}</span>
                                            {navItem.badge && <StyledBadge type={navItem.badge} className="ml-1" />}
                                        </div>
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className={cn("p-2 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl", navItem.columns === 2 ? "w-[650px]" : "w-[400px]")}>
                                            <ul className={cn("grid gap-1", navItem.columns === 2 ? "grid-cols-2 w-[600px]" : "grid-cols-1 w-[350px]")}>
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
                            );
                        }

                        return (
                            <NavigationMenuItem key={index}>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href={navItem.href || "#"}
                                        className={cn(triggerBaseClasses, isActive ? itemActiveClasses : itemIdleClasses)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {navItem.icon && <navItem.icon size={16} className={cn(isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100 transition-opacity")} />}
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
        </div>
    );
};

const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a"> & { icon?: LucideIcon; badge?: BadgeType }
>(({ className, title, children, icon, badge, ...props }, ref) => (
    <li>
        <NavigationMenuLink asChild>
            <Link
                href={props.href ?? "#"}
                ref={ref}
                className={cn(
                    "group block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors",
                    "hover:bg-gray-100/80 dark:hover:bg-white/5",
                    className
                )}
                {...props}
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Icon icon={icon} size={18} />
                        </div>
                    )}
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold leading-none text-gray-900 dark:text-white">{title}</span>
                            {badge && <StyledBadge type={badge} />}
                        </div>
                        {children && (
                            <p className="line-clamp-1 text-xs leading-snug text-gray-500 dark:text-gray-400">
                                {children}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        </NavigationMenuLink>
    </li>
));
ListItem.displayName = "ListItem";

const StyledBadge = ({ type, className }: { type: BadgeType; className?: string }) => {
    const config = {
        Nové: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        Aktualizace: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400",
        Událost: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
    };

    return (
        <Badge variant="outline" className={cn("rounded-full px-1.5 py-0 text-[9px] font-bold border-none", config[type], className)}>
            {type}
        </Badge>
    );
};