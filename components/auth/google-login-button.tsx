"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

interface GoogleLoginButtonProps {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export const GoogleLoginButton = ({
    children,
    className = "w-full",
    disabled = false
}: GoogleLoginButtonProps) => {

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/auth/profil" })
    }

    return (
        <Button
            variant="outline"
            className={className}
            disabled={disabled}
            onClick={handleGoogleLogin}
        >
            {children}
        </Button>
    )
} 