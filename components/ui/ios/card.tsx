"use client";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface IOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBackground?: string;
  iconColor?: string;
  footer?: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export const IOSCard = React.forwardRef<HTMLDivElement, IOSCardProps>(
  ({ 
    title, 
    subtitle, 
    icon, 
    iconBackground = "bg-blue-100", 
    iconColor = "text-blue-600",
    footer, 
    variant = "default", 
    className,
    headerClassName,
    contentClassName,
    footerClassName,
    children, 
    ...props 
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const baseStyles = {
      default: "bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-md",
      elevated: "bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50",
      outlined: "border-2 border-gray-200/50 bg-transparent backdrop-blur-sm"
    };

    const iconContainerStyles = cn(
      "flex items-center justify-center rounded-2xl w-10 h-10 sm:w-12 sm:h-12 shrink-0",
      iconBackground
    );

    const iconStyles = cn(
      "w-5 h-5 sm:w-6 sm:h-6",
      iconColor
    );

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl overflow-visible transition-all duration-300",
          "hover:shadow-xl hover:scale-[1.005] transform",
          baseStyles[variant],
          className
        )}
        {...props}
      >
        {(title || subtitle || icon) && (
          <div className={cn(
            "flex items-start gap-3 sm:gap-4 p-4 sm:p-6",
            headerClassName
          )}>
            {icon && (
              <div className={iconContainerStyles}>
                <div className={iconStyles}>
                  {icon}
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className={cn(
          "px-4 sm:px-6 pb-4 sm:pb-6",
          (title || subtitle || icon) ? "pt-0" : "pt-4 sm:pt-6",
          contentClassName
        )}>
          {children}
        </div>
        {footer && (
          <div className={cn(
            "px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100/50 backdrop-blur-sm",
            footerClassName
          )}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);
IOSCard.displayName = "IOSCard"; 