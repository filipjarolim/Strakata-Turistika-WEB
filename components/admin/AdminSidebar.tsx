"use client"

import * as React from "react"
import {
    BarChart,
    Database,
    FileText,
    Home,
    Image as ImageIcon,
    LayoutGrid,
    MapPin,
    Settings,
    ShieldAlert,
    Sliders,
    Users,
    Wrench,
    Server,
    Key,
    CreditCard,
    MessageSquareWarning
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Menu items.
const navMain = [
    {
        title: "Přehled",
        url: "/admin",
        icon: Home,
        isActive: true,
    },
    {
        title: "Návštěvy",
        url: "/admin/VisitData",
        icon: MapPin,
    },
    {
        title: "Uživatelé",
        url: "/admin/User",
        icon: Users,
    },
    {
        title: "Aktuality",
        url: "/admin/news",
        icon: FileText,
    },
    {
        title: "Galerie",
        url: "/admin/gallery",
        icon: ImageIcon,
    },
    {
        title: "Strakatá Cesta",
        url: "/admin/CustomRoute",
        icon: MapPin,
    },
    {
        title: "Výjimky",
        url: "/admin/ExceptionRequest",
        icon: MessageSquareWarning,
    },
]

const navSettings = [
    {
        title: "Formuláře",
        url: "/admin/formular",
        icon: FileText,
    },
    {
        title: "Bodování",
        url: "/admin/scoring",
        icon: Sliders,
    },
    {
        title: "Kategorie",
        url: "/admin/StrataCategory",
        icon: LayoutGrid,
    },
]

const navTools = [
    {
        title: "Databáze",
        url: "/admin/database",
        icon: Database,
    },
    {
        title: "Debug Tools",
        url: "/admin/debug",
        icon: Wrench,
    },
    {
        title: "Propojené účty",
        url: "/admin/Account",
        icon: CreditCard,
    },
    {
        title: "Verifikační tokeny",
        url: "/admin/VerificationToken",
        icon: Key,
    },
    {
        title: "Sezóny",
        url: "/admin/Season",
        icon: Server,
    },
]

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-gray-200 dark:border-white/10">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-sidebar-primary-foreground">
                                    <ShieldAlert className="size-4 text-white" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-bold">Admin Panel</span>
                                    <span className="">Strakatá Turistika</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Hlavní</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navMain.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url || (item.url !== "/admin" && pathname.startsWith(item.url))}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarGroupLabel>Nastavení</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navSettings.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarGroupLabel>Nástroje & Data</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navTools.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="/">
                                <Home />
                                <span>Zpět na web</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
