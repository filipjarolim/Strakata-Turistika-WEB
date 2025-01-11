"use client"

import { signIn } from "next-auth/react"

import { FaDiscord, FaGoogle } from "react-icons/fa";
import {Button} from "@/components/ui/button";
import {DEFAULT_LOGIN_REDIRECT} from "@/routes";

export const Social = () => {

    const onClick = (provider: "google" | "github" | "discord") => {
        signIn(provider, {
            callbackUrl: DEFAULT_LOGIN_REDIRECT
        })
    }

    return (
        <div className={"flex items-center w-full gap-x-2"}>
            <Button size={"lg"} className={"w-full flex flex-row items-center justify-center text-[12px] font-semibold text-[#222]"} variant={"outline"} onClick={() => onClick("google")}>
                <FaGoogle className={"h-5 w-5 mr-4"} />
                Let&apos;s go with Google
            </Button>
            <Button size={"lg"} className={"w-full flex flex-row items-center justify-center text-[12px] font-semibold text-[#222]"} variant={"outline"} onClick={() => onClick("discord")}>
                <FaDiscord className={"h-5 w-5 mr-4"} />
                Let&apos;s go with Discord
            </Button>
        </div>
    )

}