"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface IOSStepProgressProps {
  steps: string[];
  currentStep: number;
  stepImages?: string[];
  className?: string;
}

export const IOSStepProgress = ({
  steps,
  currentStep,
  stepImages,
  className
}: IOSStepProgressProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between items-start">
        {/* Progress Line */}
        <div className="absolute top-8 left-0 w-full h-[1px] bg-gray-100 dark:bg-white/10 border border-gray-200/50 dark:border-white/5">
          <div
            className="absolute top-[-1px] left-0 h-[1px] bg-blue-500/80 transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = index + 1 <= currentStep;
          const isCurrent = index + 1 === currentStep;

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 relative"
              style={{ width: `${100 / steps.length}%` }}
            >
              {/* Icon Container */}
              <div
                className={cn(
                  "relative z-10 w-16 h-16 rounded-lg flex items-center justify-center",
                  "bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-gray-200/50 dark:border-white/10",
                  isActive && "bg-blue-50/80 dark:bg-blue-500/10 border-blue-200/50 dark:border-blue-500/30",
                  isCurrent && "ring-2 ring-blue-500/20"
                )}
              >
                {stepImages?.[index] ? (
                  <Image
                    src={stepImages[index]}
                    alt={step}
                    width={48}
                    height={48}
                    className={cn(
                      "transition-all duration-500",
                      isActive ? "opacity-100" : "opacity-50"
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-500",
                      isActive ? "bg-blue-500" : "bg-gray-300 dark:bg-white/20"
                    )}
                  />
                )}
              </div>

              {/* Step Text */}
              <span
                className={cn(
                  "text-xs text-center transition-all duration-500",
                  isActive ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-white/20"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 