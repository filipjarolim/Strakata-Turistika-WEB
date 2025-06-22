"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IOSFloatingActionButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const IOSFloatingActionButton = React.forwardRef<HTMLButtonElement, IOSFloatingActionButtonProps>(
  ({ onClick, children, variant = "primary", size = "md", className, disabled, loading }, ref) => {
    const sizeClasses = {
      sm: "w-12 h-12",
      md: "w-16 h-16", 
      lg: "w-20 h-20"
    };

    const variantClasses = {
      primary: "bg-blue-500 hover:bg-blue-600 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40",
      secondary: "bg-white/90 backdrop-blur-xl hover:bg-white/95 border border-gray-200/50 shadow-xl shadow-black/10",
      danger: "bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 hover:shadow-2xl hover:shadow-red-500/40"
    };

    return (
      <motion.button
        ref={ref}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          "rounded-full flex items-center justify-center transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 transform",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {children}
          </motion.div>
        )}
      </motion.button>
    );
  }
);
IOSFloatingActionButton.displayName = "IOSFloatingActionButton"; 