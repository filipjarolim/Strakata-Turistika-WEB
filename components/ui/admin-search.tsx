'use client';

import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminSearchProps {
    value?: string;
    onSearch: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
}

export const AdminSearch = ({
    value = '',
    onSearch,
    placeholder = 'Hledat...',
    className,
    debounceMs = 300
}: AdminSearchProps) => {
    const [searchTerm, setSearchTerm] = useState(value);

    // Sync with external value changes
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== value) {
                onSearch(searchTerm);
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs, onSearch, value]);

    const handleClear = () => {
        setSearchTerm('');
        onSearch('');
    };

    return (
        <div className={cn("relative w-full max-w-sm", className)}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
            </div>
            <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9 h-10 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={placeholder}
            />
            {searchTerm && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Vymazat</span>
                </Button>
            )}
        </div>
    );
};
