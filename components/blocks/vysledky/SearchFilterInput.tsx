import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export const SearchFilterInput: React.FC<Props> = ({ 
    value, 
    onChange, 
    placeholder = "Hledat...",
    className = "" 
}) => {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`pl-10 ${className}`}
            />
        </div>
    );
};