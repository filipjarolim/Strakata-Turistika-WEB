"use client";
import React, { useRef } from "react";
import { cn } from "@/lib/utils";

interface IOSCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
}

export const IOSCard = React.forwardRef<HTMLDivElement, IOSCardProps>(
  ({ title, subtitle, icon, footer, variant = "default", className, children, ...props }, ref) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const baseStyles = "rounded-2xl bg-white/80 backdrop-blur-lg";
    const variantStyles = {
      default: "border border-gray-200",
      elevated: "shadow-lg shadow-black/5",
      outlined: "border-2 border-gray-200",
    };

    return (
      <div
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          cardRef.current = node;
        }}
        className={cn(
          baseStyles,
          variantStyles[variant],
          "overflow-hidden h-full flex flex-col relative",
          "transition-all duration-300 ease-out",
          className
        )}
        {...props}
      >
        {/* Glass overlay for full height */}
        <div className="absolute inset-0 z-0 transition-colors duration-300 bg-white/80" style={{backdropFilter: 'blur(20px)'}} />
        <div className="relative z-20 flex flex-col flex-1 h-full">
          {(title || subtitle || icon) && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="flex-shrink-0 text-blue-600">
                    {icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {title && (
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm text-gray-500">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="p-4 flex-1 flex flex-col justify-center">
            {children}
          </div>
          {footer && (
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }
);
IOSCard.displayName = "IOSCard"; 