"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface IOSStatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "info";
  className?: string;
}

export const IOSStatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className
}: IOSStatsCardProps) => {
  const variantStyles = {
    default: "bg-white/90 backdrop-blur-xl border-gray-200/50 shadow-lg",
    success: "bg-green-50/90 backdrop-blur-xl border-green-200/50 shadow-lg",
    warning: "bg-amber-50/90 backdrop-blur-xl border-amber-200/50 shadow-lg",
    info: "bg-blue-50/90 backdrop-blur-xl border-blue-200/50 shadow-lg"
  };

  const iconColors = {
    default: "text-gray-600 bg-gray-100/50",
    success: "text-green-600 bg-green-100/50",
    warning: "text-amber-600 bg-amber-100/50",
    info: "text-blue-600 bg-blue-100/50"
  };

  return (
    <div className={cn(
      "p-6 rounded-3xl border backdrop-blur-xl",
      "transition-all duration-300 hover:shadow-lg hover:scale-[1.002] transform",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {icon && (
              <div className={cn("p-3 rounded-2xl", iconColors[variant])}>
                {icon}
              </div>
            )}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend.isPositive ? "text-green-600 bg-green-100/50" : "text-red-600 bg-red-100/50"
              )}>
                <TrendingUp className={cn(
                  "w-3 h-3",
                  trend.isPositive ? "rotate-0" : "rotate-180"
                )} />
                {trend.value}%
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}; 