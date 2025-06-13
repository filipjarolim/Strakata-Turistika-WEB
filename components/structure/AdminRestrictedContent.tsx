"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield } from "lucide-react";
import { ReactNode } from "react";

type AdminRestrictedContentProps = {
    role: string;
    permittedRole?: string;
    tooltipText?: string;
    variant?: 'default' | 'icon';
    icon?: ReactNode;
    onClick?: (e?: React.MouseEvent) => void;  // Updated type
    children?: ReactNode;
};

export function AdminRestrictedContent({
    role,
    permittedRole = "ADMIN",
    tooltipText,
    variant = 'default',
    icon,
    onClick,
    children,
}: AdminRestrictedContentProps) {
    if (role !== permittedRole) return null;

    if (variant === 'icon') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onClick}
                            className="h-8 w-8 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center text-white"
                        >
                            {icon}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>{tooltipText}</span>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
            {children}
            <Shield className="w-4 h-4" />
        </button>
    );
}