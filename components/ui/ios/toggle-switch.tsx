"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const IOSToggleSwitch = React.forwardRef<HTMLButtonElement, IOSToggleSwitchProps>(
  ({ checked, onCheckedChange, disabled, className, size = "md" }, ref) => {
    const sizeClasses = {
      sm: "w-10 h-6",
      md: "w-12 h-7", 
      lg: "w-14 h-8"
    };

    const thumbSizeClasses = {
      sm: "w-5 h-5",
      md: "w-6 h-6",
      lg: "w-7 h-7"
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          checked 
            ? "bg-blue-500 shadow-lg shadow-blue-500/30" 
            : "bg-gray-200 shadow-inner",
          className
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full transition-all duration-300 ease-out",
            "bg-white shadow-sm",
            thumbSizeClasses[size],
            checked && "translate-x-5",
            "transform"
          )}
        />
      </button>
    );
  }
);
IOSToggleSwitch.displayName = "IOSToggleSwitch"; 