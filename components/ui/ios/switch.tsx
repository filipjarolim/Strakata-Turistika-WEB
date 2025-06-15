"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const IOSSwitch = React.forwardRef<HTMLInputElement, IOSSwitchProps>(
  ({ label, error, className, ...props }, ref) => {
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
              {...props}
            />
            <div
              className={cn(
                "w-12 h-7 rounded-full transition-all duration-200",
                "bg-gray-200",
                props.checked && "bg-blue-600",
                props.disabled && "opacity-50 cursor-not-allowed",
                className
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-6 h-6 rounded-full transition-all duration-200",
                  "bg-white shadow-sm",
                  props.checked && "translate-x-5"
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