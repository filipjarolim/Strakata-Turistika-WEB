"use client"

import { useRouter } from "next/navigation"
import {Button} from "@/components/ui/button";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import {authprefix} from "@/assets/auth";

interface RegisterButtonProps {
    children: React.ReactNode;
    mode?: "modal" | "redirect";
    asChild?: boolean;
}

export const RegisterButton = ({
                                children,
                                mode = "redirect",
                                asChild
                            }: RegisterButtonProps) => {

    const router = useRouter()

    const onClick = () => {
        router.push("/auth/register")
    }

    if (mode === "modal") {
        return (
            <div>
                TODO: Implement modal
            </div>
        )
    }

    return (
        <span onClick={onClick} className={"cursor-pointer"}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={"secondary"} size={"lg"} className={"rounded-full border bg-[#111] dark:bg-white hover:bg-[#000] dark:text-black font-semibold text-white "}>
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent className={"flex flex-row items-center justify-center"}>
                    {authprefix.buttons.register.tooltip.icon}
                    {authprefix.buttons.register.tooltip.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </span>
    )
}