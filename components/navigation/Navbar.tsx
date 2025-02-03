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
import Icon from "@/components/ui/Icon";
import * as Icons from 'lucide-react';

type BadgeType = "Nové" | "Aktualizace" | "Událost";

type NavItem = {
    title: string;
    href: string;
    description?: string;
    icon?: keyof typeof Icons;
    badge?: BadgeType;
};

type NavConfigType = {
    type: "roletka" | "odkaz";
    title: string;
    icon?: keyof typeof Icons;
    columns?: number;
    href?: string;
    badge?: BadgeType;
    items?: NavItem[];
}[];

const navConfig: NavConfigType = [
    {
        type: "roletka",
        title: "Začínáme",
        icon: "Rocket",
        columns: 2,
        items: [
            { title: "Úvod", href: "/docs", description: "Znovu použitelné komponenty postavené pomocí Radix UI a Tailwind CSS.", icon: "Book", badge: "Nové" },
            { title: "Instalace", href: "/docs/installation", description: "Jak nainstalovat závislosti a strukturovat aplikaci.", icon: "Download" },
            { title: "Typografie", href: "/docs/primitives/typography", description: "Styly pro nadpisy, odstavce, seznamy...atd.", icon: "Type", badge: "Aktualizace" }
        ]
    },
    {
        type: "roletka",
        title: "Komponenty",
        icon: "Box",
        columns: 3,
        items: [
            { title: "Upozornění", href: "/docs/primitives/alert-dialog", description: "Modální dialog, který upozorní uživatele na důležitý obsah.", icon: "AlertCircle" },
            { title: "Karta při přejetí", href: "/docs/primitives/hover-card", description: "Pro náhled obsahu za odkazem pro viditelné uživatele.", icon: "MousePointer" },
            { title: "Pokrok", href: "/docs/primitives/progress", description: "Indikátor ukazující stav dokončení úkolu.", icon: "BarChart", badge: "Událost" }
        ]
    },
    {
        type: "odkaz",
        title: "Dokumentace",
        icon: "FileText",
        href: "/docs",
    }
];

const NavigationMenuTriggerClassName = "flex flex-row items-end text-[13px] bg-transparent pr-4  h-fit pl-0 font-small text-black/80 leading-none ";

export const Navbar = () => {
    return (
        <nav className="gap-x-2 flex justify-between items-center px-4 " style={{ zIndex: 100 }}>
            <NavigationMenu>
                <NavigationMenuList>
                    {navConfig.map((navItem, index) => {
                        return navItem.type === "roletka" ? (
                            <NavigationMenuItem key={index} className={"cursor-pointer"}>
                                <NavigationMenuTrigger className={NavigationMenuTriggerClassName}>
                                    {navItem.icon && <Icon name={navItem.icon} className="size-[13px] mr-2" />}
                                    {navItem.title}
                                    {navItem.badge && <StyledBadge type={navItem.badge} />}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className={`grid gap-3 p-4 w-[800px] grid-cols-${navItem.columns || 1}`}>
                                        {navItem.items?.map((item, i) => (
                                            <ListItem key={i} title={item.title} href={item.href} icon={item.icon} badge={item.badge}>
                                                {item.description}
                                            </ListItem>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>
                        ) : (
                            <NavigationMenuItem key={index} className="cursor-pointer" >
                                <Link href={navItem.href as string} legacyBehavior passHref >
                                    <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), NavigationMenuTriggerClassName)}>
                                        {navItem.icon && <Icon name={navItem.icon} className="size-[13px] mr-2" />}
                                        {navItem.title}
                                        {navItem.badge && <StyledBadge type={navItem.badge} />}
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
    React.ComponentPropsWithoutRef<"a"> & { icon?: keyof typeof Icons; badge?: BadgeType }
>(({ className, title, children, icon, badge, ...props }, ref) => {
    return (
        <li className="w-[300px]">
            <NavigationMenuLink asChild>
                <Link href={props.href ?? "#"} legacyBehavior passHref>
                    <a
                        ref={ref}
                        className={cn(
                            "block cursor-pointer select-none space-y-1 rounded-md p-3 leading-none no-underline outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                            className
                        )}
                        {...props}
                    >
                        <div className="flex items-center gap-2 text-sm font-medium leading-none">
                            {icon && <Icon name={icon} className="w-4 h-4" />}
                            {title}
                            {badge && <StyledBadge type={badge} />}
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
                    </a>
                </Link>
            </NavigationMenuLink>
        </li>
    );
});

const StyledBadge = ({ type }: { type: BadgeType }) => {
    const badgeColors = {
        Nové: "bg-green-500 text-white",
        Aktualizace: "bg-blue-500 text-white",
        Událost: "bg-red-500 text-white"
    };
    return (
        <Badge variant="default" className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeColors[type]}`}>{type}</Badge>
    );
};

ListItem.displayName = "ListItem";