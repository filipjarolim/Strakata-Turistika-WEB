import React from 'react';
import { Input } from '@/components/ui/input';

type Props = {
    filterValue: string;
    setFilterValue: (value: string) => void;
};

export const SearchFilterInput: React.FC<Props> = ({ filterValue, setFilterValue }) => {
    return (
        <Input
            placeholder="Filtr Jméno..."
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            className="max-w-sm"
        />
    );
};