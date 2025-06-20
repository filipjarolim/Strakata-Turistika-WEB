"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const IOSSection = ({
  title,
  subtitle,
  children,
  className,
  headerClassName,
  contentClassName
}: IOSSectionProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || subtitle) && (
        <div className={cn("space-y-1", headerClassName)}>
          {title && (
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      <div className={cn("space-y-3", contentClassName)}>
        {children}
      </div>
    </div>
  );
}; 