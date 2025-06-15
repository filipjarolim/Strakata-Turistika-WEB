"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface IOSSlidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    side?: "left" | "right";
    className?: string;
}

export const IOSSlidePanel = ({
    isOpen,
    onClose,
    children,
    side = "left",
    className
}: IOSSlidePanelProps) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                />
            )}
            <motion.div
                key="panel"
                initial={{ x: side === "left" ? "-98%" : "98%" }}
                animate={{ x: isOpen ? 0 : side === "left" ? "-98%" : "98%" }}
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 300,
                    bounce: 0.2
                }}
                className={cn(
                    "fixed top-0 bottom-0 w-[400px] z-50",
                    side === "left" ? "left-0" : "right-0",
                    "overflow-y-auto",
                    className
                )}
                style={{ touchAction: "none" }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

// Create a context for the slide panel state
const IOSSlidePanelContext = React.createContext<{
    isOpen: boolean;
    open: () => void;
    close: () => void;
}>({
    isOpen: false,
    open: () => {},
    close: () => {}
});

export const useIOSSlidePanel = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const open = React.useCallback(() => setIsOpen(true), []);
    const close = React.useCallback(() => setIsOpen(false), []);
    return { isOpen, open, close };
}; 