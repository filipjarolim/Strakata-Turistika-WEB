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
        <span onClick={onClick} className="cursor-pointer">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                        variant="secondary" 
                        size="md" 
                        className={`
                            group relative overflow-hidden rounded-2xl px-6 py-2.5
                            bg-gradient-to-r from-blue-600 to-blue-500 
                            hover:from-blue-500 hover:to-blue-400
                            text-white font-semibold text-sm
                            border border-blue-500/50 hover:border-blue-400/50
                            shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35
                            hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-200 ease-out
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
                            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0
                            before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
                        `}
                    >
                        {children}
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="flex flex-row items-center justify-center bg-blue-600 text-white border-blue-500">
                    {authprefix.buttons.register.tooltip.icon}
                    {authprefix.buttons.register.tooltip.label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </span>
    )
}