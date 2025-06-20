"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { IOSLabel } from "./label";

interface IOSTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const IOSTextInput = React.forwardRef<HTMLInputElement, IOSTextInputProps>(
  ({ label, error, required, className, type = "text", readOnly, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <IOSLabel required={required}>
            {label}
          </IOSLabel>
        )}
        <input
          ref={ref}
          type={type}
          readOnly={readOnly}
          className={cn(
            "w-full h-12 px-4 rounded-xl",
            "bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm",
            "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
            "transition-all duration-200",
            "text-gray-900 placeholder:text-gray-400",
            "disabled:bg-gray-100/50 disabled:cursor-not-allowed",
            readOnly && "bg-gray-50/50 cursor-not-allowed",
            error && "border-red-300 focus:ring-red-500/30 focus:border-red-500/50",
            className
          )}
          {...props}
        />
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