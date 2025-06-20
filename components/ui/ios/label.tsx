"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export const IOSLabel = React.forwardRef<HTMLLabelElement, IOSLabelProps>(
  ({ children, required, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "block text-sm font-semibold text-gray-700 mb-2 select-none",
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);
IOSLabel.displayName = "IOSLabel"; 