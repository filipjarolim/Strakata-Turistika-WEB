import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface StepProgressProps {
  steps: string[];
  currentStep: number; // 1-based index
  className?: string;
  stepImages?: string[]; // Optional: image path for each step
}

export default function StepProgress({ steps, currentStep, className, stepImages }: StepProgressProps) {
  return (
    <nav className={cn('flex items-center w-full justify-center gap-0', className)} aria-label="Progress">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isUpcoming = stepNum > currentStep;
        const imageSrc = stepImages && stepImages[idx] ? stepImages[idx] : undefined;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center min-w-[110px]">
              <div className="flex items-center justify-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full border-2 transition-all relative overflow-visible',
                    isCompleted && 'bg-green-500 border-green-500',
                    isCurrent && 'bg-white border-green-500',
                    isUpcoming && 'bg-white border-gray-300',
                    'w-10 h-10',
                  )}
                >
                  {imageSrc && (
                    <Image
                      src={imageSrc}
                      alt="Step icon"
                      width={128}
                      height={128}
                      className="pointer-events-none select-none"
                      style={{ 
                        position: 'absolute', 
                        left: '50%', 
                        top: '50%', 
                        transform: 'translate(-50%, -50%) scale(2)', 
                        transformOrigin: 'center',
                        zIndex: 1 
                      }}
                    />
                  )}
                  {/* {isCompleted && (
                    <span className="absolute inset-0 flex items-center justify-center z-10">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )} */}
                </div>
              </div>
              <span
                className={cn(
                  'mt-2 text-sm font-medium',
                  isCompleted && 'text-green-600',
                  isCurrent && 'text-green-600',
                  isUpcoming && 'text-gray-400',
                )}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 min-w-[40px]">
                <div className={cn(
                  'w-full h-full',
                  (isCompleted || isCurrent) ? 'bg-green-500' : 'bg-gray-200'
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
} 