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
          variant === 'default' && "bg-white/80 backdrop-blur-xl text-gray-900 hover:bg-white/90 border border-gray-200/50 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10",
          variant === 'outline' && "border border-gray-200/50 bg-white/50 backdrop-blur-xl hover:bg-gray-50/80 hover:text-gray-900 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10",
          variant === 'blue' && "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
          variant === 'primary' && "bg-blue-500 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30",
          // Sizes - Responsive design
          size === 'default' && "h-10 px-4 py-2 text-sm sm:h-11 sm:px-5 sm:text-base",
          size === 'sm' && "h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm",
          size === 'md' && "h-11 px-6 py-2.5 text-base sm:h-12 sm:px-7 sm:text-lg",
          size === 'lg' && "h-12 px-8 text-lg sm:h-14 sm:px-10 sm:text-xl",
          size === 'icon' && "h-10 w-10 sm:h-11 sm:w-11",
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
        ) : (
          <>
            {icon && <span className="mr-2 sm:mr-3">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);
IOSButton.displayName = "IOSButton"; 