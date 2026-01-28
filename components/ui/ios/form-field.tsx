import React from 'react';
import { cn } from "@/lib/utils";
import { IOSLabel } from './label';
import { AnimatePresence, motion } from 'framer-motion';

interface IOSFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string | React.ReactNode;
    labelIcon?: React.ReactNode;
    error?: string | null;
    required?: boolean;
    description?: string;
    children: React.ReactNode;
    dark?: boolean;
}

export const IOSFormField = React.forwardRef<HTMLDivElement, IOSFormFieldProps>(
    ({ className, label, labelIcon, error, required, description, children, dark, ...props }, ref) => {
        return (
            <div ref={ref} className={cn("space-y-1.5", className)} {...props}>
                {label && (
                    <IOSLabel icon={labelIcon} required={required} dark={dark}>
                        {label}
                    </IOSLabel>
                )}

                {children}

                <AnimatePresence mode="wait">
                    {error ? (
                        <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wider ml-1"
                        >
                            {error}
                        </motion.p>
                    ) : description ? (
                        <p className={cn("text-[10px] font-medium ml-1", dark ? "text-white/40" : "text-slate-400")}>
                            {description}
                        </p>
                    ) : null}
                </AnimatePresence>
            </div>
        );
    }
);
IOSFormField.displayName = "IOSFormField";
