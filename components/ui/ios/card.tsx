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
  titleClassName?: string;
  subtitleClassName?: string;
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
    titleClassName,
    subtitleClassName,
    children,
    ...props
  }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const baseStyles = {
      default: "bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-xl shadow-black/5",
      elevated: "bg-white/98 dark:bg-zinc-900/98 backdrop-blur-2xl shadow-2xl border border-gray-200 dark:border-white/10",
      outlined: "border-2 border-gray-200 dark:border-white/10 bg-transparent backdrop-blur-sm"
    };

    const iconContainerStyles = cn(
      "flex items-center justify-center rounded-2xl w-12 h-12 sm:w-14 sm:h-14 shrink-0",
      iconBackground
    );

    const iconStyles = cn(
      "w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center",
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
                <h3 className={cn(
                  "text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white",
                  titleClassName
                )}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={cn(
                  "text-sm line-clamp-2 leading-relaxed text-gray-600 dark:text-gray-400",
                  subtitleClassName
                )}>
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
            "px-6 sm:px-8 py-4 sm:py-5 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100/50 dark:border-white/5 backdrop-blur-sm",
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