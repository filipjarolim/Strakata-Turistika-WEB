import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { IOSLabel } from './label';

interface IOSSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    className?: string;
    required?: boolean;
    name?: string;
    label?: string;
    dark?: boolean;
}

export const IOSSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select an option",
    className,
    required,
    name,
    label,
    dark = false
}: IOSSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
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

    const handleToggle = () => {
        if (!isOpen) {
            // Calculate position before opening
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const dropdownHeight = Math.min(options.length * 40 + 16, 300); // Approximate dropdown height
                
                setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
            }
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="w-full mb-4">
            {label && (
                <IOSLabel required={required}>
                    {label}
                </IOSLabel>
            )}
            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    name={name}
                    onClick={handleToggle}
                    className={cn(
                        "w-full h-12 px-4 rounded-xl",
                        dark 
                            ? "bg-black/40 backdrop-blur-sm border border-white/30 hover:bg-black/50 hover:border-white/40"
                            : "bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm",
                        "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
                        "transition-all duration-200",
                        "flex items-center justify-between",
                        "text-left",
                        className
                    )}
                >
                    <span className={cn(
                        dark 
                            ? (value ? "text-white" : "text-white/60")
                            : (value ? "text-gray-900" : "text-gray-400")
                    )}>
                        {selectedLabel || placeholder}
                    </span>
                    <ChevronDown 
                        className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            dark ? "text-white/80" : "text-gray-600",
                            isOpen && "transform rotate-180"
                        )} 
                    />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={contentRef}
                            initial={{ opacity: 0, y: dropdownPosition === 'bottom' ? -10 : 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: dropdownPosition === 'bottom' ? -10 : 10, scale: 0.98 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={cn(
                                "absolute z-[99999] w-full",
                                dropdownPosition === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2',
                                dark 
                                    ? "bg-gray-800/95 backdrop-blur-xl border-white/30" 
                                    : "bg-white/95 backdrop-blur-xl",
                                "rounded-xl border shadow-lg",
                                "max-h-[300px] overflow-y-auto",
                                "py-2"
                            )}
                            style={{
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)'
                            }}
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
                                        dark
                                            ? "text-white hover:bg-white/10"
                                            : "text-gray-900 hover:bg-gray-100/50",
                                        "transition-colors duration-200",
                                        value === option.value && (dark ? "bg-white/10" : "bg-gray-100/50")
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}; 