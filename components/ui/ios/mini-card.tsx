"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IOSMiniCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  unit?: string;
  className?: string;
  variant?: "default" | "highlight" | "subtle";
}

export const IOSMiniCard = React.forwardRef<HTMLDivElement, IOSMiniCardProps>(
  ({ title, value, icon, unit, className, variant = "default" }, ref) => {
    const variantClasses = {
      default: "bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/10",
      highlight: "bg-blue-50/90 backdrop-blur-xl border border-blue-200/50 shadow-lg shadow-blue-500/10",
      subtle: "bg-gray-50/90 backdrop-blur-xl border border-gray-200/50 shadow-md shadow-black/5"
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-2xl p-3 text-center transition-all duration-300 ease-out",
          "hover:shadow-xl hover:scale-[1.02] transform",
          variantClasses[variant],
          className
        )}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {icon && (
          <motion.div 
            className="flex justify-center mb-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-1.5 rounded-xl bg-blue-100/50">
              {icon}
            </div>
          </motion.div>
        )}
        
        <motion.div
          className="text-xs font-medium text-gray-600 mb-1"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.div>
        
        <motion.div
          className="flex items-baseline justify-center gap-1"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-lg font-bold text-gray-900">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-gray-500">
              {unit}
            </span>
          )}
        </motion.div>
      </motion.div>
    );
  }
);
IOSMiniCard.displayName = "IOSMiniCard"; 