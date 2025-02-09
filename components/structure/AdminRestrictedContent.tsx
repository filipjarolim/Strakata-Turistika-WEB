"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { Shield } from "lucide-react"; // Icon from lucide-react
import clsx from "clsx";
import { ReactNode } from "react";

type AdminRestrictedContentProps = {
    role: string; // Current user role, e.g., "ADMIN"
    permittedRole: string; // Role required to access the content
    tooltipText?: string; // Text for the tooltip
    isButton?: boolean; // Determines whether it's a button or container
    label?: ReactNode; // JSX/HTML/TSX for the label
    onClick?: () => void; // Optional click handler for buttons
    containerStyles?: string; // Additional styling for containers
};

export function AdminRestrictedContent({
                                           role,
                                           permittedRole,
                                           tooltipText = "ADMIN ONLY",
                                           isButton = true,
                                           label = "",
                                           onClick,
                                           containerStyles = "",
                                       }: AdminRestrictedContentProps) {
    // Show nothing if the user doesn't have the permitted role
    if (role !== permittedRole) return null;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {isButton ? (
                        // Button layout with ShadCN's Button
                        <Button
                            onClick={onClick}
                            variant="outline"
                            className="relative p-0 border-blue-700 border-2 overflow-hidden border-2"
                        >
                            {/* Dynamic Label (can render JSX/TSX content) */}
                            <span className="px-4 font-medium flex flex-row items-center justify-center h-full">
                {label}
              </span>
                            <div className="flex items-center justify-center h-full px-2 bg-blue-700 text-white">
                                <Shield className="w-6 h-6" />
                            </div>
                        </Button>
                    ) : (
                        // Container layout
                        <div
                            className={clsx(
                                "relative border border-blue-700 rounded-lg p-4 overflow-hidden border-2",
                                containerStyles
                            )}
                        >
                            {/* Dynamic Label (can render JSX/TSX content) */}
                            <div>{label}</div>
                            <div className="absolute top-0 right-0 bg-blue-700 p-2 rounded-bl-md shadow-md">
                                <Shield className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    )}
                </TooltipTrigger>
                <TooltipContent>
                    <span>{tooltipText}</span>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}