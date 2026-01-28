"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  // Deprecated props kept for safety during refactor if needed, but unused
  label?: string;
  error?: string;
  required?: boolean;
}

export const IOSSwitch = React.forwardRef<HTMLButtonElement, IOSSwitchProps>(
  ({ checked, onCheckedChange, disabled, className }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-indigo-500 shadow-indigo-500/20 shadow-lg" : "bg-gray-200 dark:bg-black/50",
          className
        )}
        ref={ref}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    );
  }
);
IOSSwitch.displayName = "IOSSwitch"; 