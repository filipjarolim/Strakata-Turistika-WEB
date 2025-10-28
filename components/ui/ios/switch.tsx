"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { IOSLabel } from "./label";

interface IOSSwitchProps {
  label?: string;
  error?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const IOSSwitch = React.forwardRef<HTMLInputElement, IOSSwitchProps>(
  ({ label, error, checked, onCheckedChange, disabled, className, required }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <IOSLabel required={required}>
            {label}
          </IOSLabel>
        )}
        <label className="flex items-center justify-between cursor-pointer p-4 rounded-2xl bg-black/40 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-black/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white select-none">
              {label}
            </span>
          </div>
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={(e) => onCheckedChange(e.target.checked)}
              disabled={disabled}
            />
            <div
              className={cn(
                "w-12 h-7 rounded-full transition-all duration-300 ease-out",
                "bg-white/20 shadow-inner",
                checked && "bg-blue-500 shadow-md",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-all duration-300 ease-out",
                  "bg-white shadow-sm",
                  checked && "translate-x-5",
                  "transform"
                )}
              />
            </div>
          </div>
        </label>
        {error && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1 h-1 rounded-full bg-red-500" />
            <div className="text-xs text-red-600">{error}</div>
          </div>
        )}
      </div>
    );
  }
);
IOSSwitch.displayName = "IOSSwitch"; 