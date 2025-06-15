"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Bug } from "lucide-react";
import { IOSSlidePanel, useIOSSlidePanel } from "@/components/ui/ios/slide-panel";
import { usePathname } from 'next/navigation';
import html2canvas from 'html2canvas';
import { cn } from "@/lib/utils";
import { ExtendedUser } from "@/next-auth";
import { IOSForm, FormField } from "@/components/ui/ios/form";
import { z } from "zod";

interface BugReportPanelProps {
    currentUser?: ExtendedUser | null;
    currentRole?: string;
}

interface BugReportFormData {
    name: string;
    email: string;
    bugType: 'ui' | 'functionality' | 'performance' | 'security' | 'other';
    message: string;
}

const getRoleColors = (role?: string) => {
    switch (role) {
        case 'ADMIN':
            return {
                border: 'from-blue-600/10 to-blue-700/10 border-blue-600/20',
                hover: 'hover:from-blue-600/20 hover:to-blue-700/20 hover:border-blue-600/30',
                text: 'text-blue-900/90',
                focus: 'focus:ring-blue-500/50',
                button: 'bg-blue-600 hover:bg-blue-700'
            };
        case 'TESTER':
            return {
                border: 'from-orange-600/10 to-orange-700/10 border-orange-600/20',
                hover: 'hover:from-orange-600/20 hover:to-orange-700/20 hover:border-orange-600/30',
                text: 'text-orange-900/90',
                focus: 'focus:ring-orange-500/50',
                button: 'bg-orange-600 hover:bg-orange-700'
            };
        default:
            return {
                border: 'from-gray-400/10 to-gray-500/10 border-gray-400/20',
                hover: 'hover:from-gray-400/20 hover:to-gray-500/20 hover:border-gray-400/30',
                text: 'text-gray-900/90',
                focus: 'focus:ring-gray-500/50',
                button: 'bg-gray-600 hover:bg-gray-700'
            };
    }
};

const formatRole = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export const BugReportPanel = ({ currentUser, currentRole }: BugReportPanelProps) => {
    const { isOpen, open, close } = useIOSSlidePanel();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const pathname = usePathname();
    const colors = getRoleColors(currentRole);

    const captureScreenshot = async () => {
        try {
            close();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const canvas = await html2canvas(document.body, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            return canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            return null;
        }
    };

    const formFields: FormField[] = [
        {
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            defaultValue: currentUser?.name || '',
            validation: z.string().min(2, "Name must be at least 2 characters")
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
            defaultValue: currentUser?.email || '',
            validation: z.string().email("Invalid email address")
        },
        {
            name: 'bugType',
            label: 'Bug Type',
            type: 'select',
            required: true,
            options: [
                { value: 'ui', label: 'UI/UX Issue' },
                { value: 'functionality', label: 'Functionality Bug' },
                { value: 'performance', label: 'Performance Issue' },
                { value: 'security', label: 'Security Concern' },
                { value: 'other', label: 'Other' }
            ],
            validation: z.enum(['ui', 'functionality', 'performance', 'security', 'other'])
        },
        {
            name: 'message',
            label: 'Description',
            type: 'textarea',
            required: true,
            placeholder: 'Please describe the bug in detail...',
            validation: z.string().min(10, "Description must be at least 10 characters")
        }
    ];

    const handleSubmit = async (data: BugReportFormData) => {
        setIsSubmitting(true);
        const screenshot = await captureScreenshot();
        
        const submitData = {
            ...data,
            type: 'bug',
            subject: `Bug Report: ${data.bugType}`,
            pageInfo: {
                url: window.location.href,
                path: pathname,
                timestamp: new Date().toISOString(),
                screenshot
            }
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to send message');
            }
            
            close();
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentRole || currentRole === 'UZIVATEL') return null;

    return (
        <>
            <motion.div 
                animate={{ 
                    y: isOpen ? -400 : -10,
                    transition: { 
                        type: 'spring', 
                        damping: 25, 
                        stiffness: 300,
                        bounce: 0.2,
                        restDelta: 0.001
                    }
                }}
                onClick={open}
                className={cn(
                    "fixed left-4 top-3/4 -translate-y-1/2 rotate-90 origin-left px-4 py-2 cursor-pointer select-none",
                    "bg-gradient-to-r backdrop-blur-xl rounded-t-lg border-t border-l border-r",
                    "z-[1000000]",
                    colors.border,
                    colors.hover
                )}
            >
                <div className="flex items-center gap-2">
                    {currentRole === 'ADMIN' ? (
                        <Shield className={cn("w-4 h-4", colors.text)} />
                    ) : (
                        <Bug className={cn("w-4 h-4", colors.text)} />
                    )}
                    <span className={cn("font-medium tracking-wide text-sm", colors.text)}>
                        {formatRole(currentRole)}
                    </span>
                </div>
            </motion.div>

            <IOSSlidePanel
                isOpen={isOpen}
                onClose={close}
                side="left"
                className={cn(
                    "bg-gradient-to-r backdrop-blur-xl border-r",
                    colors.border
                )}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className={cn("text-xl font-semibold", colors.text)}>
                            Bug Report
                        </h2>
                        <button 
                            onClick={close}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <IOSForm
                        fields={formFields}
                        onSubmit={(data) => handleSubmit({
                            name: String(data.name),
                            email: String(data.email),
                            bugType: data.bugType as BugReportFormData['bugType'],
                            message: String(data.message),
                        })}
                        submitLabel="Submit Report"
                        isLoading={isSubmitting}
                        initialData={{
                            name: currentUser?.name || '',
                            email: currentUser?.email || ''
                        }}
                        colors={{
                            text: colors.text,
                            focus: colors.focus,
                            button: colors.button
                        }}
                    />
                </div>
            </IOSSlidePanel>
        </>
    );
}; 