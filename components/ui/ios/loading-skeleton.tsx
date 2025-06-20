"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface IOSLoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export const IOSLoadingSkeleton = ({
  className,
  lines = 3,
  height = "h-4"
}: IOSLoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse bg-gray-200 rounded-lg",
            height,
            index === lines - 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
};

export const IOSCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn(
      "p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-lg",
      "animate-pulse",
      className
    )}>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded-lg w-1/3" />
        <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
        <div className="h-8 bg-gray-200 rounded-lg w-1/4" />
      </div>
    </div>
  );
}; 