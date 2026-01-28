'use client';

import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AdminFilterProps {
    value?: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
    label?: string;
    className?: string;
    showCount?: boolean;
}

export const AdminFilter = ({
    value,
    onValueChange,
    options,
    placeholder = "Filtrovat...",
    label,
    className,
    showCount = false
}: AdminFilterProps) => {
    // Find selected label for count/badge if needed
    const isSelected = !!value && value !== 'all' && value !== '';

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {label && (
                <span className="text-xs font-semibold text-muted-foreground ml-1">
                    {label}
                </span>
            )}
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className={cn("h-10 w-[180px] bg-background", isSelected && "border-primary ring-1 ring-primary/20", className)}>
                    <SelectValue placeholder={placeholder} />
                    {showCount && isSelected && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 rounded-sm lg:hidden">
                            1
                        </Badge>
                    )}
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
