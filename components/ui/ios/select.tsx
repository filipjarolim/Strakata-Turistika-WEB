import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface IOSSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    name?: string;
}

export const IOSSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select an option",
    className,
    required,
    name
}: IOSSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const selected = options.find(opt => opt.value === value);
        setSelectedLabel(selected?.label || '');
    }, [value, options]);

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
            <button
                ref={triggerRef}
                type="button"
                name={name}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-12 px-4 rounded-xl",
                    "bg-white/50 backdrop-blur-sm",
                    "border-0 shadow-sm",
                    "focus:ring-2 focus:ring-offset-2 focus:ring-offset-white/50",
                    "transition-all duration-200",
                    "flex items-center justify-between",
                    "text-left",
                    className
                )}
            >
                <span className={value ? "text-gray-900" : "text-gray-500"}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown 
                    className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isOpen && "transform rotate-180"
                    )} 
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={contentRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={cn(
                            "absolute z-[1000000000001] w-full mt-2",
                            "bg-white/95 backdrop-blur-xl",
                            "rounded-xl border shadow-lg",
                            "max-h-[300px] overflow-y-auto",
                            "py-2"
                        )}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-4 py-2 text-left",
                                    "hover:bg-gray-100/50",
                                    "transition-colors duration-200",
                                    value === option.value && "bg-gray-100/50"
                                )}
                            >
                                {option.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}; 