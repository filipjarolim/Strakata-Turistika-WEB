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

type BadgeType = "New" | "Update" | "Event";

type NavItem = {
    title: string;
    href: string;
    description?: string;
    icon?: keyof typeof Icons;
    shortcut?: string;
    badge?: BadgeType;
};

type NavConfigType = {
    type: "dropdown" | "link";
    title: string;
    icon?: keyof typeof Icons;
    columns?: number;
    href?: string;
    shortcut?: string;
    badge?: BadgeType;
    items?: NavItem[];
}[];

const navConfig: NavConfigType = [
    {
        type: "dropdown",
        title: "Getting Started",
        icon: "Rocket",
        columns: 2,
        items: [
            { title: "Introduction", href: "/docs", description: "Re-usable components built using Radix UI and Tailwind CSS.", icon: "Book", shortcut: "⌘I", badge: "New" },
            { title: "Installation", href: "/docs/installation", description: "How to install dependencies and structure your app.", icon: "Download", shortcut: "⌘D" },
            { title: "Typography", href: "/docs/primitives/typography", description: "Styles for headings, paragraphs, lists...etc.", icon: "Type", shortcut: "⌘T", badge: "Update" }
        ]
    },
    {
        type: "dropdown",
        title: "Components",
        icon: "Box",
        columns: 3,
        items: [
            { title: "Alert Dialog", href: "/docs/primitives/alert-dialog", description: "A modal dialog that interrupts the user with important content.", icon: "AlertCircle", shortcut: "⌘A" },
            { title: "Hover Card", href: "/docs/primitives/hover-card", description: "For sighted users to preview content available behind a link.", icon: "MousePointer", shortcut: "⌘H" },
            { title: "Progress", href: "/docs/primitives/progress", description: "Displays an indicator showing the completion progress of a task.", icon: "BarChart", shortcut: "⌘P", badge: "Event" }
        ]
    },
    {
        type: "link",
        title: "Documentation",
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
                        return navItem.type === "dropdown" ? (
                            <NavigationMenuItem key={index} className={"cursor-pointer"}>
                                <NavigationMenuTrigger className={NavigationMenuTriggerClassName}>
                                    {navItem.icon && <Icon name={navItem.icon} className="size-[13px] mr-2" />}
                                    {navItem.title}
                                    {navItem.badge && <StyledBadge type={navItem.badge} />}
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className={`grid gap-3 p-4 w-[800px] grid-cols-${navItem.columns || 1}`}>
                                        {navItem.items?.map((item, i) => (
                                            <ListItem key={i} title={item.title} href={item.href} icon={item.icon} shortcut={item.shortcut} badge={item.badge}>
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
                                        {navItem.shortcut && <span className="ml-auto text-xs text-muted-foreground">{navItem.shortcut}</span>}
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
    React.ComponentPropsWithoutRef<"a"> & { icon?: keyof typeof Icons; shortcut?: string; badge?: BadgeType }
>(({ className, title, children, icon, shortcut, badge, ...props }, ref) => {
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
                            {shortcut && <span className="ml-auto text-xs text-muted-foreground">{shortcut}</span>}
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
        New: "bg-green-500 text-white",
        Update: "bg-blue-500 text-white",
        Event: "bg-red-500 text-white"
    };
    return (
        <Badge variant="default" className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeColors[type]}`}>{type}</Badge>
    );
};

ListItem.displayName = "ListItem";