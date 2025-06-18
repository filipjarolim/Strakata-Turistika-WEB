"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSCircleIconProps {
  children: React.ReactNode;
  variant?: "default" | "amber" | "blue" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const IOSCircleIcon = React.forwardRef<HTMLDivElement, IOSCircleIconProps>(
  ({ children, variant = "default", size = "md", className }, ref) => {
    const variantStyles = {
      default: "bg-gray-100 text-gray-600",
      amber: "bg-amber-100 text-amber-600",
      blue: "bg-blue-100 text-blue-600",
      red: "bg-red-100 text-red-600"
    };

    const sizeStyles = {
      sm: "w-8 h-8 text-sm",
      md: "w-12 h-12 text-lg",
      lg: "w-16 h-16 text-2xl"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-full flex items-center justify-center",
          "transition-all duration-200",
          "shadow-sm",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
      >
        {children}
      </div>
    );
  }
);
IOSCircleIcon.displayName = "IOSCircleIcon"; 