"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { UserButton } from "@/components/auth/user-button"
import { Navbar } from "@/components/navigation/Navbar"
import { LoginButton } from "@/components/auth/login-button"
import { LogoutButton } from "@/components/auth/logout-button"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import basicInfo from "@/lib/settings/basicInfo";
import localFont from 'next/font/local'
import {cn} from "@/lib";
const myFont = localFont({ src: '../../assets/fonts/Nohemi-VF.ttf' })
const Header = ({
                    user, role
}: {
    user?: object
    role?: string
}) => {
    const [menuOpen, setMenuOpen] = useState(false)

    const toggleMenu = () => {
        setMenuOpen(!menuOpen)
    }

    return (
        <header className="grid grid-cols-2 md:grid-cols-7 w-full p-2">
            <Link href="/" className={cn("flex flex-row items-center justify-start  font-extrabold text-gray-900/80 hover:text-gray-900/90 transition-color duration-200", myFont.className)}>
                <Image src={basicInfo.img.icons.transparentHeader} alt="Logo" width={32} height={32} className={"mr-[5px]"} />
                Strakatá Turistika
            </Link>
            <div className="col-span-1 md:col-span-5 hidden w-full flex-row items-center justify-center md:flex">
                <Navbar />
            </div>
            <div className="flex flex-row items-center justify-end">
                <div className="hidden md:flex flex-row items-center justify-center gap-x-2">
                    {!user ? (
                        <LoginButton>Připojte se</LoginButton>
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
                        <SheetContent side="top" style={{
                            zIndex: 50,
                        }}>
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
    )
}

export default Header