"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@/components/auth/user-button";
import { Navbar } from "@/components/navigation/Navbar";
import { LoginButton } from "@/components/auth/login-button";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import basicInfo from "@/lib/settings/basicInfo";
import localFont from "next/font/local";
import { cn } from "@/lib";
import { RegisterButton } from "../auth/register-button";

const Header = ({
                    user,
                    role,
                }: {
    user?: object;
    role?: string;
}) => {
    const headerRef = useRef<HTMLElement | null>(null);
    const [headerHeight, setHeaderHeight] = useState<number>(0);

    const updateHeaderHeight = () => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
    };

    useEffect(() => {
        updateHeaderHeight();

        // Update on window resize for responsiveness
        window.addEventListener("resize", updateHeaderHeight);
        return () => {
            window.removeEventListener("resize", updateHeaderHeight);
        };
    }, []);

    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <>
            <header
                ref={headerRef}
                className={cn(
                    "grid grid-cols-2 md:grid-cols-9 w-[70%] mx-auto px-6 pt-6 pb-4 fixed left-1/2 translate-x-[-50%] rounded-b-2xl",
                    "h-fit"
                )}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)", // White with transparency
                    backdropFilter: "blur(8px)", // Apply blur to the background
                    zIndex: 100,
                }}
            >
                <Link
                    href="/"
                    className={
                        "flex flex-row items-center justify-start col-span-1 md:col-span-2 text-[20px] font-bold text-black/70 transition-color duration-200"
                    }
                >
                    <Image
                        src={basicInfo.img.icons.transparentHeaderOutline}
                        alt="Logo"
                        width={32}
                        height={32}
                        className={"mr-[5px]"}
                    />
                    Strakatá Turistika
                </Link>
                <div className="col-span-1 md:col-span-5 hidden w-full md:flex flex-row items-center">
                    <Navbar />
                </div>
                <div className="flex flex-row items-end justify-end col-span-1 md:col-span-2">
                    <div className="hidden md:flex flex-row items-end justify-center gap-x-2">
                        {!user ? (
                            <div className={"flex flex-row items-center justify-center gap-x-2"}>
                                <LoginButton>Přihlásit se</LoginButton>
                                <RegisterButton>Začít</RegisterButton>

                            </div>
                        ) : (
                            <UserButton />
                        )}
                    </div>
                    <div className="md:hidden flex items-center ">
                        <Sheet>
                            <SheetTrigger asChild>
                                <div className={`hamburger`} onClick={toggleMenu}>
                                    <span></span>
                                    <span></span>
                                </div>
                            </SheetTrigger>
                            <SheetContent
                                side="top"
                                style={{
                                    zIndex: 50,
                                }}
                            >
                                <SheetHeader>
                                    <SheetTitle>Menu</SheetTitle>
                                    <SheetDescription>
                                        Navigace a uživatelské rozhraní.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Link href="/" className="col-span-4">
                                            Home
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Link href="/playground" className="col-span-4">
                                            Playground
                                        </Link>
                                    </div>
                                    <LogoutButton>Odejít</LogoutButton>
                                </div>
                                <SheetFooter>
                                    <SheetClose asChild>
                                        <Button type="button">Zavřít</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Bottoms div (matches the height of the header) */}
            <div
                style={{
                    height: `${headerHeight}px`, // Dynamically set the height
                }}
            >

            </div>
        </>
    );
};

export default Header;