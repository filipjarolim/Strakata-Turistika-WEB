import React from 'react';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

interface IOSLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  required?: boolean;
  dark?: boolean;
}

export const IOSLabel = React.forwardRef<HTMLLabelElement, IOSLabelProps>(
  ({ className, children, icon, required, dark, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors select-none",
          dark ? "text-white/60" : "text-black",
          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn("flex items-center justify-center", dark ? "text-white/80" : "text-black")}>
            {/* Ensure icon size is controlled if passed as raw node, though usually we pass <Icon /> */}
            {React.isValidElement(icon) ?
              React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                className: cn("w-3.5 h-3.5", (icon.props as { className?: string }).className)
              })
              : icon}
          </span>
        )}
        {children}
        {required && <span className="text-red-500 ml-0.5" title="Povinné pole">*</span>}
      </label>
    );
  }
);
IOSLabel.displayName = "IOSLabel";