"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'blue' | 'primary';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95 transform",
          // Variants
          variant === 'default' && "bg-white/80 backdrop-blur-sm text-gray-900 hover:bg-white/90 border border-gray-200/50 shadow-sm",
          variant === 'outline' && "border border-gray-200/50 bg-white/50 backdrop-blur-sm hover:bg-gray-50/80 hover:text-gray-900 shadow-sm",
          variant === 'blue' && "bg-blue-500 text-white hover:bg-blue-600 shadow-md",
          variant === 'primary' && "bg-blue-500 text-white hover:bg-blue-600 shadow-lg",
          // Sizes
          size === 'default' && "h-10 px-4 py-2 text-sm",
          size === 'sm' && "h-9 px-3 text-sm",
          size === 'md' && "h-11 px-6 py-2.5 text-base",
          size === 'lg' && "h-12 px-8 text-lg",
          size === 'icon' && "h-10 w-10",
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);
IOSButton.displayName = "IOSButton"; 