"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface IOSButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'blue' | 'primary' | 'ghost';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const IOSButton = React.forwardRef<HTMLButtonElement, IOSButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, icon, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95 transform",
          "hover:shadow-lg hover:shadow-black/10",
          // Variants
          variant === 'default' && "bg-white/90 backdrop-blur-xl text-gray-900 hover:bg-white/95 border border-gray-200/50 shadow-lg shadow-black/5",
          variant === 'outline' && "border border-gray-200/50 bg-white/80 backdrop-blur-xl hover:bg-gray-50/90 hover:text-gray-900 shadow-lg shadow-black/5",
          variant === 'blue' && "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
          variant === 'primary' && "bg-blue-500 text-white hover:bg-blue-600 shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30",
          variant === 'ghost' && "bg-transparent hover:bg-black/5 text-gray-700 dark:text-white dark:hover:bg-white/10 shadow-none hover:shadow-none",
          // Sizes - Responsive design
          size === 'default' && "h-11 px-5 py-2.5 text-sm sm:h-12 sm:px-6 sm:text-base",
          size === 'sm' && "h-9 px-3.5 text-xs sm:h-10 sm:px-4 sm:text-sm",
          size === 'md' && "h-12 px-7 py-3 text-base sm:h-14 sm:px-8 sm:text-lg",
          size === 'lg' && "h-14 px-10 text-lg sm:h-16 sm:px-12 sm:text-xl",
          size === 'icon' && "h-11 w-11 sm:h-12 sm:w-12",
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