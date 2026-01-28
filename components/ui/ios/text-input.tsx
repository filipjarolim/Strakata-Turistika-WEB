import React from "react";
import { cn } from "@/lib/utils";

interface IOSTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  // Deprecated props that might be passed but ignored
  label?: string;
  error?: string;
  dark?: boolean;
}

export const IOSTextInput = React.forwardRef<HTMLInputElement, IOSTextInputProps>(
  ({ className, type = "text", icon, label, error, dark, ...props }, ref) => {
    return (
      <div className="relative group">
        {icon && React.isValidElement(icon) && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors z-10">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: cn(
                "w-5 h-5 transition-colors",
                // Force base colors and override any passed colors
                "text-black dark:text-white",
                (icon.props as { className?: string }).className
              )
            })}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/90 dark:bg-black/40 px-5 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder:text-white/40 placeholder:opacity-100 text-black dark:text-white focus-visible:outline-none focus-visible:border-indigo-500/50 dark:focus-visible:border-indigo-500/50 focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:shadow-lg focus-visible:shadow-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 backdrop-blur-xl",
            icon && "pl-12",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
IOSTextInput.displayName = "IOSTextInput"; 