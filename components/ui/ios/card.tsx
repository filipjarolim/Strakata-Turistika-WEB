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
      default: "bg-white/95 backdrop-blur-2xl border border-gray-200/30 shadow-xl shadow-black/5",
      elevated: "bg-white/98 backdrop-blur-2xl shadow-2xl border border-gray-200/20",
      outlined: "border-2 border-gray-200/50 bg-transparent backdrop-blur-sm"
    };

    const iconContainerStyles = cn(
      "flex items-center justify-center rounded-2xl w-12 h-12 sm:w-14 sm:h-14 shrink-0",
      iconBackground
    );

    const iconStyles = cn(
      "w-6 h-6 sm:w-7 sm:h-7",
      iconColor
    );

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl overflow-visible transition-all duration-300 ease-out",
          "hover:shadow-2xl hover:scale-[1.01] transform",
          "hover:shadow-black/10",
          baseStyles[variant],
          className
        )}
        {...props}
      >
        {(title || subtitle || icon) && (
          <div className={cn(
            "flex items-start gap-4 sm:gap-5 p-6 sm:p-8",
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
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className={cn(
          "px-6 sm:px-8 pb-6 sm:pb-8",
          (title || subtitle || icon) ? "pt-0" : "pt-6 sm:pt-8",
          contentClassName
        )}>
          {children}
        </div>
        {footer && (
          <div className={cn(
            "px-6 sm:px-8 py-4 sm:py-5 bg-gray-50/50 border-t border-gray-100/50 backdrop-blur-sm",
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