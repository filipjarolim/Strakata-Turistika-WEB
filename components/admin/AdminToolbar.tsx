'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AdminToolbarProps {
    children: React.ReactNode;
    className?: string;
}

export const AdminToolbar = ({ children, className }: AdminToolbarProps) => {
    return (
        <div className={cn(
            "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-1",
            className
        )}>
            {children}
        </div>
    );
};

export const AdminToolbarGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={cn("flex flex-wrap items-center gap-2 w-full md:w-auto", className)}>
            {children}
        </div>
    );
};
