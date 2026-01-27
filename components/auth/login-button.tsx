"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
// import {LuScanFace} from "react-icons/lu"; // Removed
import { authprefix } from "@/assets/auth";

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
        <span onClick={onClick} className="cursor-pointer">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            size="md"
                            className={`
                            group relative overflow-hidden rounded-2xl px-6 py-2.5
                            bg-gradient-to-r from-gray-900 to-gray-800 
                            hover:from-gray-800 hover:to-gray-700
                            text-white font-semibold text-sm
                            border border-gray-700/50 hover:border-gray-600/50
                            shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30
                            hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-200 ease-out
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
                            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0
                            before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
                        `}
                        >
                            {children}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="flex flex-row items-center justify-center bg-gray-900 text-white border-gray-700" style={{ zIndex: 110 }}>
                        {authprefix.buttons.login.tooltip.icon}
                        {authprefix.buttons.login.tooltip.label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </span>
    )
}