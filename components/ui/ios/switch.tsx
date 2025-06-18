"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSSwitchProps {
  label?: string;
  error?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const IOSSwitch = React.forwardRef<HTMLInputElement, IOSSwitchProps>(
  ({ label, error, checked, onCheckedChange, disabled, className }, ref) => {
    return (
      <div className="w-full mb-4">
        <label className="flex items-center justify-between cursor-pointer">
          {label && (
            <span className="text-sm font-semibold text-blue-900 select-none">
              {label}
            </span>
          )}
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
                "w-12 h-7 rounded-full transition-all duration-200",
                "bg-gray-200",
                checked && "bg-blue-600",
                disabled && "opacity-50 cursor-not-allowed",
                className
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-all duration-200",
                  "bg-white shadow-sm",
                  checked && "translate-x-5"
                )}
              />
            </div>
          </div>
        </label>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
    );
  }
);
IOSSwitch.displayName = "IOSSwitch"; 