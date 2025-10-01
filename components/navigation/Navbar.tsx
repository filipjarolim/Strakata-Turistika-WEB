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
                href: "/vysledky/moje", 
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
                                        "text-sm transition-all duration-200 ease-out px-3 py-2 rounded-lg",
                                        "bg-gray-900/10 backdrop-blur-xl font-medium h-full",
                                        "border border-gray-900/20 hover:border-gray-900/30",
                                        textColor,
                                        "hover:bg-gray-900/20",
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
                                        "w-[800px] rounded-xl overflow-hidden shadow-xl border bg-white border-gray-200/60"
                                    )}>
                                        <ul className={cn("grid gap-3 p-6 w-full", `grid-cols-${navItem.columns || 1}`)}>
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
                                <Link href={navItem.href as string} legacyBehavior passHref>
                                    <NavigationMenuLink
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm transition-all duration-200 ease-out px-3 py-2 rounded-lg h-full backdrop-blur-xl",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
                                            isActive 
                                                ? "bg-white/30 font-medium text-gray-900 border border-white/40" 
                                                : cn(textColor, "bg-gray-900/10 hover:bg-gray-900/20 border border-gray-900/20 hover:border-gray-900/30", hoverStyles.activeBg, hoverStyles.hoverText, hoverStyles.activeText)
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
                                    </NavigationMenuLink>
                                </Link>
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
                <Link href={props.href ?? "#"} legacyBehavior passHref>
                    <a
                        ref={ref}
                        className={cn(
                            "flex flex-col gap-2 rounded-lg p-3 hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 ease-out",
                            "border border-transparent hover:border-gray-200/50",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2",
                            className
                        )}
                        {...props}
                    >
                        <div className="flex items-center gap-2">
                            {icon && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200">
                                    <Icon icon={icon} className="w-4 h-4 text-gray-700" />
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{title}</span>
                                {badge && <StyledBadge type={badge} />}
                            </div>
                        </div>
                        {children && (
                            <p className="text-xs text-gray-500 line-clamp-2">{children}</p>
                        )}
                    </a>
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