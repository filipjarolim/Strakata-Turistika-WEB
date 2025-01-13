"use client"

import React from 'react'
import {useCurrentUser} from "@/hooks/use-current-user";
import {UserButton} from "@/components/auth/user-button";
import {Navbar} from "@/app/(protected)/_components/navbar";
import {LoginButton} from "@/components/auth/login-button";
import {LogoutButton} from "@/components/auth/logout-button";

const Header = () => {

    const user = useCurrentUser();


    return (
        <header className={"flex flex-row items-center justify-between w-full p-2"}>

            <UserButton/>
            <Navbar />
            <div className={"flex flex-row items-center justify-center"}>
                <LoginButton>
                    Join us
                </LoginButton>
                <LogoutButton>
                    Logout
                </LogoutButton>
            </div>

        </header>
    )
}
export default Header
