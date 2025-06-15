"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ children, loading, className, disabled, ...props }, ref) => {
    // Check if children is an array and has an icon as first child
    const hasIcon = React.Children.toArray(children).some(
      child => React.isValidElement(child) && child.type === 'svg'
    );

    // Separate icon and text content
    const icon = React.Children.toArray(children).find(
      child => React.isValidElement(child) && child.type === 'svg'
    );
    const textContent = React.Children.toArray(children).filter(
      child => !(React.isValidElement(child) && child.type === 'svg')
    );

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "w-full h-12 rounded-xl font-semibold text-white",
          "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
          "transition-all duration-200 shadow-sm",
          "focus:ring-2 focus:ring-blue-500/50 focus:outline-none",
          "flex items-center justify-center gap-2",
          disabled || loading ? "opacity-60 cursor-not-allowed" : "",
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : hasIcon ? (
          <>
            {icon}
            {textContent}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
IOSButton.displayName = "IOSButton"; 