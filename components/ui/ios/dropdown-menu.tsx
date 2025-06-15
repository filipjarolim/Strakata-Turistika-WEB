"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface IOSDropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const IOSDropdownMenu = ({
  trigger,
  children,
  align = 'right',
  className
}: IOSDropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 400,
              mass: 0.8
            }}
            className={cn(
              "absolute z-[1000000000001] mt-1.5 w-52",
              align === 'right' ? 'right-0' : 'left-0',
              "bg-white/80 backdrop-blur-xl",
              "rounded-2xl border border-gray-200/50",
              "shadow-lg shadow-black/5",
              "p-1.5",
              className
            )}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface IOSDropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  shortcut?: string;
}

export const IOSDropdownMenuItem = ({
  children,
  onClick,
  className,
  icon,
  shortcut
}: IOSDropdownMenuItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left",
        "hover:bg-gray-100/50 active:bg-gray-200/50",
        "transition-all duration-200",
        "flex items-center justify-between",
        "text-sm",
        "rounded-xl",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-500 w-4 h-4">{icon}</span>}
        <span className="text-gray-900">{children}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-gray-400 font-medium">{shortcut}</span>
      )}
    </button>
  );
};

export const IOSDropdownMenuSeparator = () => (
  <div className="h-px bg-gray-200/50 my-1.5" />
);

export const IOSDropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400">
    {children}
  </div>
); 