"use client";

import { logout } from "@/actions/auth/logout";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
    children?: React.ReactNode;
    className?: string;
};

export const LogoutButton = ({
                                 children,
    className
                             }: LogoutButtonProps) => {
    const onClick = () => {
        logout();
    };

    return (
        <span 
            onClick={onClick} 
            className={cn(
                "cursor-pointer text-inherit transition-all duration-200 hover:opacity-80 active:opacity-60",
                className
            )}
        >
            {children}
        </span>
    );
};