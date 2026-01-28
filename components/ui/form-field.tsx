import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string
    error?: string
    required?: boolean
    description?: string
    children: React.ReactNode
}

export function FormField({
    label,
    error,
    required,
    description,
    children,
    className,
    ...props
}: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {label && (
                <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 text-gray-700 dark:text-gray-200">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                </Label>
            )}
            {children}
            {description && !error && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {error && (
                <p className="text-xs font-medium text-red-500 animate-in slide-in-from-top-1 fade-in-0">
                    {error}
                </p>
            )}
        </div>
    )
}
