"use client";

import { signIn } from "next-auth/react";

import { FaGoogle, FaApple } from "react-icons/fa"; // Changed to FaApple instead of FaDiscord
import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const Social = () => {
    const onClick = (provider: "google" | "apple") => {
        signIn(provider, {
            callbackUrl: DEFAULT_LOGIN_REDIRECT,
        });
    };

    return (
        <div className={"flex flex-wrap items-center justify-center w-full gap-x-2"}>
            {/* Google Login */}
            <Button
                size={"lg"}
                className={
                    "w-full flex flex-row items-center justify-center text-[12px] font-semibold text-[#222]"
                }
                variant={"outline"}
                onClick={() => onClick("google")}
            >
                <FaGoogle className={"h-5 w-5 mr-4"} />
                Pokračujte s Googlem
            </Button>

            {/*<Button*/}
            {/*    size={"lg"}*/}
            {/*    className={*/}
            {/*        "w-fit flex flex-row items-center justify-center text-[12px] font-semibold text-[#222]"*/}
            {/*    }*/}
            {/*    variant={"outline"}*/}
            {/*    onClick={() => onClick("apple")}*/}
            {/*>*/}
            {/*    <FaApple className={"h-5 w-5 mr-4"} />*/}
            {/*    Pokračujte s Apple*/}
            {/*</Button>*/}
        </div>
    );
};