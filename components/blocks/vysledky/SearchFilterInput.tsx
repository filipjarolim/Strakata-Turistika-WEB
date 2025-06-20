'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { cn } from '@/lib/utils';

interface SearchFilterInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const SearchFilterInput = ({
    value,
    onChange,
    placeholder = "Hledat...",
    className
}: SearchFilterInputProps) => {
    return (
        <div className={cn("relative flex items-center", className)}>
            <Search className="absolute left-3 z-10 text-gray-400 h-4 w-4" />
            <IOSTextInput
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pl-10"
            />
        </div>
    );
};