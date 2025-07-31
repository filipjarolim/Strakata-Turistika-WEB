"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { ReactNode } from "react";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";

type AdminRestrictedContentProps = {
    role: string;
    permittedRole?: string;
    badgeText?: string;
    variant?: 'default' | 'icon';
    icon?: ReactNode;
    onClick?: (e?: React.MouseEvent) => void;
    children?: ReactNode;
    buttonClassName?: string;
};

export function AdminRestrictedContent({
    role,
    permittedRole = "ADMIN",
    badgeText = "Admin",
    variant = 'default',
    icon,
    onClick,
    children,
    buttonClassName,
}: AdminRestrictedContentProps) {
    const isPermitted = role === permittedRole;

    if (variant === 'icon') {
        if (isPermitted) {
            return (
                <button
                    onClick={onClick}
                    className={"rounded-full bg-blue-100 hover:bg-blue-200 transition-colors flex items-center justify-center text-blue-600 shadow-sm " + (buttonClassName || "")}
                    style={{ width: 36, height: 36 }}
                    aria-label={badgeText}
                >
                    {icon}
                </button>
            );
        } else {
            return (
                <IOSBadge
                    label={badgeText}
                    size="md"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    textColor="text-blue-500"
                    className="px-4 py-0.5 min-h-0 text-xs font-semibold"
                />
            );
        }
    }

    if (variant === 'default') {
        if (isPermitted) {
            return (
                <IOSButton
                    onClick={onClick}
                    className={buttonClassName}
                >
                    {children}
                </IOSButton>
            );
        } else {
            return (
                <IOSBadge
                    label={badgeText}
                    size="md"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    textColor="text-blue-500"
                    className="px-4 py-0.5 min-h-0 text-xs font-semibold"
                />
            );
        }
    }

    return null;
}