"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "fixed flex w-auto max-w-md items-center justify-between space-x-4 rounded-md border p-4 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive: "border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-600 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
        warning: "border-yellow-600 bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
        info: "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      },
      position: {
        topRight: "top-4 right-4",
        topLeft: "top-4 left-4",
        bottomRight: "bottom-4 right-4",
        bottomLeft: "bottom-4 left-4",
        topCenter: "top-4 left-1/2 -translate-x-1/2",
        bottomCenter: "bottom-4 left-1/2 -translate-x-1/2",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "topRight",
    },
  }
)

export interface ToastProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function Toast({
  className,
  variant,
  position,
  open = false,
  onOpenChange,
  title,
  description,
  action,
  duration = 5000,
  ...props
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(open);
  
  useEffect(() => {
    setIsVisible(open);
  }, [open]);
  
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onOpenChange?.(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onOpenChange]);
  
  const handleClose = () => {
    setIsVisible(false);
    onOpenChange?.(false);
  };
  
  if (!isVisible) return null;
  
  return (
    <div
      className={cn(toastVariants({ variant, position, className }))}
      data-state={isVisible ? "open" : "closed"}
      {...props}
    >
      <div className="grid gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={handleClose}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-secondary/20 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}
