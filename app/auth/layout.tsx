import React from 'react'
import localFont from 'next/font/local'
import {cn} from "@/lib/utils";
import Link from "next/link";
import {BiLeftArrow} from "react-icons/bi";
import {ChevronLeftIcon} from "@radix-ui/react-icons";

// Font files can be colocated inside of `pages`
const myFont = localFont({ src: "../../assets/fonts/Nohemi-Bold-BF6438cc577b524.woff" })

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (

        <section className={"w-full h-full overflow-y-auto"}>
            <header className={"px-8 pt-8"}>
                <Link href={"/"} className={"flex flex-row items-center justify-start font-bold text-sm text-muted-foreground"}>
                    <ChevronLeftIcon />
                    Home
                </Link>
            </header>
            <main>
                <div className={"flex justify-center items-start mx-auto flex-row w-[90%] overflow-hidden"}>
                    {children}
                </div>
            </main>
        </section>

    )
}
export default AuthLayout
