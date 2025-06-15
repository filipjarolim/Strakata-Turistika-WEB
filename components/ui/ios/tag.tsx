"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface IOSTagProps {
  label: string;
  onRemove?: () => void;
  className?: string;
}

export const IOSTag = React.forwardRef<HTMLDivElement, IOSTagProps>(
  ({ label, onRemove, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 px-3 py-1 rounded-full",
          "bg-blue-100 text-blue-900",
          "text-sm font-medium",
          "transition-all duration-200",
          className
        )}
      >
        <span>{label}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-0.5 rounded-full hover:bg-blue-200 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);
IOSTag.displayName = "IOSTag"; 