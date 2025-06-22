"use client"

import { useRouter } from "next/navigation"
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/login-form";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {Badge} from "@/components/ui/badge";
import {LuScanFace} from "react-icons/lu";
import {authprefix} from "@/assets/auth";

interface LoginButtonProps {
    children: React.ReactNode;
    mode?: "modal" | "redirect";
    asChild?: boolean;
}

export const LoginButton = ({
                                children,
                                mode = "redirect",
                                asChild
                            }: LoginButtonProps) => {

    const router = useRouter()

    const onClick = () => {
        router.push("/auth/login")
    }

    if (mode === "modal") {
        return (
            <Dialog>
                <DialogTrigger asChild={asChild}>
                    {children}
                </DialogTrigger>
                <DialogContent className="p-0 w-auto bg-transparent border-none">
                    <DialogTitle className="sr-only">Login</DialogTitle>
                    <LoginForm />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <span onClick={onClick} className={"cursor-pointer"}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={"secondary"} size={"md"} className={"rounded-full border dark:bg-black bg-white  text-black font-semibold dark:text-white hover:bg-[#000] hover:text-[#fff] dark:hover:bg-[#222]"}>
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent className={"flex flex-row items-center justify-center"} style={{zIndex: 110}}>
                    {authprefix.buttons.login.tooltip.icon}
                    {authprefix.buttons.login.tooltip.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </span>
    )
}