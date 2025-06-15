import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface IOSSlidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    side?: 'left' | 'right';
    className?: string;
}

export const IOSSlidePanel = ({
    isOpen,
    onClose,
    children,
    side = 'left',
    className,
}: IOSSlidePanelProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [currentX, setCurrentX] = useState(0);

    const handleDragStart = (e: React.PointerEvent) => {
        if (!isOpen) return;
        setIsDragging(true);
        setDragStart(e.clientX);
        setCurrentX(0);
    };

    const handleDrag = (e: React.PointerEvent) => {
        if (!isDragging || !isOpen) return;
        
        const delta = side === 'left' 
            ? e.clientX - dragStart 
            : dragStart - e.clientX;
        
        if (delta > 0) {
            setCurrentX(delta);
        }
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (currentX > 100) {
            onClose();
        }
        setCurrentX(0);
    };

    return (
        <>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    className="fixed inset-0 bg-black z-[999999999999]"
                    onClick={onClose}
                />
            )}
            <motion.div
                initial={false}
                animate={{ 
                    x: isDragging ? currentX : isOpen ? 0 : side === 'left' ? '-98%' : '98%',
                    transition: { 
                        type: 'spring', 
                        damping: 25, 
                        stiffness: 300,
                        bounce: 0.2,
                        restDelta: 0.001
                    }
                }}
                className={cn(
                    "fixed top-0 h-full w-[400px] sm:w-[540px] z-[1000000000000]",
                    side === 'left' ? 'left-0' : 'right-0',
                    !isOpen && 'pointer-events-none',
                    "bg-gradient-to-r backdrop-blur-xl",
                    className
                )}
                onPointerDown={handleDragStart}
                onPointerMove={handleDrag}
                onPointerUp={handleDragEnd}
                onPointerLeave={handleDragEnd}
            >
                {children}
            </motion.div>
        </>
    );
};

export const useIOSSlidePanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev)
    };
}; 