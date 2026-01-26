"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { IOSLabel } from "./label";

interface IOSTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  dark?: boolean;
  icon?: React.ReactNode;
}

export const IOSTextInput = React.forwardRef<HTMLInputElement, IOSTextInputProps>(
  ({ label, error, required, dark, className, type = "text", readOnly, icon, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <IOSLabel required={required} className={dark ? "text-white/90" : ""}>
            {label}
          </IOSLabel>
        )}
        <div className="relative">
          {icon && (
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none",
              dark ? "text-white/50" : "text-gray-400"
            )}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            readOnly={readOnly}
            className={cn(
              "w-full h-12 rounded-xl transition-all duration-200",
              icon ? "pl-11 pr-4" : "px-4",
              dark ? [
                "bg-white/10 backdrop-blur-sm border border-white/20",
                "focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50",
                "text-white placeholder:text-white/40",
                "disabled:bg-white/5 disabled:cursor-not-allowed",
              ] : [
                "bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm",
                "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
                "text-gray-900 placeholder:text-gray-400",
                "disabled:bg-gray-100/50 disabled:cursor-not-allowed",
              ],
              readOnly && (dark ? "bg-white/5 cursor-not-allowed" : "bg-gray-50/50 cursor-not-allowed"),
              error && "border-red-300 focus:ring-red-500/30 focus:border-red-500/50",
              className
            )}
            {...props}
          />
        </div>
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
IOSTextInput.displayName = "IOSTextInput"; 