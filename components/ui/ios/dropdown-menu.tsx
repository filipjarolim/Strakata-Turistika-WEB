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
              "absolute z-[1000000000001] mt-2 w-64",
              align === 'right' ? 'right-0' : 'left-0',
              "bg-white border border-gray-200/60",
              "rounded-2xl shadow-xl shadow-black/10",
              "p-2",
              className
            )}
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
        "w-full px-3 py-2.5 text-left",
        "hover:bg-gray-50 active:bg-gray-100",
        "transition-all duration-200 ease-out",
        "flex items-center justify-between",
        "text-sm font-medium",
        "rounded-xl",
        "group",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-gray-500 group-hover:text-gray-700 transition-colors duration-200 w-4 h-4 flex items-center justify-center">
            {icon}
          </span>
        )}
        <span className="text-gray-900 group-hover:text-gray-700 transition-colors duration-200">{children}</span>
      </div>
      {shortcut && (
        <span className="text-xs text-gray-400 font-medium group-hover:text-gray-500 transition-colors duration-200">{shortcut}</span>
      )}
    </button>
  );
};

export const IOSDropdownMenuSeparator = () => (
  <div className="h-px bg-gray-200/60 my-2" />
);

export const IOSDropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
    {children}
  </div>
); 