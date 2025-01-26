"use client"

import React from 'react'

import Image from 'next/image'

import {useCurrentUser} from "@/hooks/use-current-user";
import {UserButton} from "@/components/auth/user-button";
import {Navbar} from "@/app/(protected)/_components/navbar";
import {LoginButton} from "@/components/auth/login-button";
import {LogoutButton} from "@/components/auth/logout-button";
import PageLogo from "@/public/icons/icon-192x192.png"

const Header = () => {

    const user = useCurrentUser();


    return (
        <header className={"grid grid-cols-7 w-full p-2"}>

            <div className={"flex flex-row items-center justify-start gap-x-2 font-bold"}>
                <Image src={PageLogo} alt={"Logo"} width={32} height={32} className={"rounded-full"}/>
                Strakatá turistika
            </div>
            <div className={"col-span-5 w-full flex flex-row items-center justify-center"}>
                <Navbar />
            </div>
            <div className={"flex flex-row items-center justify-end"}>
                {
                    !user ?
                        <LoginButton>
                            Join us
                        </LoginButton>
                        :
                        <div className={"flex flex-row items-center justify-center gap-x-2"}>
                            <UserButton/>
                        </div>
                }
            </div>

        </header>
    )
}
export default Header
