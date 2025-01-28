"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCurrentUser } from "@/hooks/use-current-user"
import { UserButton } from "@/components/auth/user-button"
import { Navbar } from "@/app/(protected)/_components/navbar"
import { LoginButton } from "@/components/auth/login-button"
import { LogoutButton } from "@/components/auth/logout-button"
import PageLogo from "@/public/icons/icon-192x192.png"
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

const Header = () => {
    const user = useCurrentUser()
    const [menuOpen, setMenuOpen] = useState(false)

    const toggleMenu = () => {
        setMenuOpen(!menuOpen)
    }

    return (
        <header className="grid grid-cols-2 md:grid-cols-7 w-full p-2">
            <Link href="/" className="flex flex-row items-center justify-start gap-x-2 font-bold">
                <Image src={PageLogo} alt="Logo" width={32} height={32} className="rounded-full" />
                Strakatá turistika
            </Link>
            <div className="col-span-1 md:col-span-5 hidden w-full flex-row items-center justify-center md:flex">
                <Navbar />
            </div>
            <div className="flex flex-row items-center justify-end">
                <div className="hidden md:flex flex-row items-center justify-center gap-x-2">
                    {!user ? (
                        <LoginButton>Join us</LoginButton>
                    ) : (
                        <UserButton />
                    )}
                    <LogoutButton>Leave</LogoutButton>
                </div>
                <div className="md:hidden flex items-center z-60">
                    <Sheet>
                        <SheetTrigger asChild>
                            <div className={`hamburger`} onClick={toggleMenu}>
                                <span></span>
                                <span></span>
                            </div>
                        </SheetTrigger>
                        <SheetContent side="bottom">
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                                <SheetDescription>
                                    Navigation and user options.
                                </SheetDescription>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Link href="/profile" className="col-span-4">
                                        Profile
                                    </Link>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Link href="/settings" className="col-span-4">
                                        Settings
                                    </Link>
                                </div>
                            </div>
                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button type="button">Close</Button>
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