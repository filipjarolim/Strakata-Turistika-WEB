"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const IOSTextInput = React.forwardRef<HTMLInputElement, IOSTextInputProps>(
  ({ label, error, className, type = "text", readOnly, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-sm font-semibold text-blue-900 mb-1 select-none">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          readOnly={readOnly}
          className={cn(
            "w-full h-12 px-4 rounded-xl",
            "bg-white/50 backdrop-blur-sm border-0 shadow-sm",
            "focus:ring-2 focus:ring-offset-2 focus:ring-offset-white/50 focus:ring-blue-500/50",
            "transition-all duration-200",
            "text-gray-900 placeholder:text-gray-400",
            readOnly && "bg-gray-100/50 cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
    );
  }
);
IOSTextInput.displayName = "IOSTextInput"; 