import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, Users } from 'lucide-react';

type ToggleViewButtonProps = {
    isCumulativeView: boolean;
    toggleView: () => void;
    label?: string;
    detailedViewLabel?: string;
    aggregatedViewLabel?: string;
};

export const ToggleViewButton: React.FC<ToggleViewButtonProps> = ({
    isCumulativeView,
    toggleView,
    label,
    detailedViewLabel = 'Detailed View',
    aggregatedViewLabel = 'Aggregated View',
}) => (
    <Button
        variant="ghost"
        onClick={toggleView}
        className="flex items-center gap-2"
    >
        {isCumulativeView ? <Users className="w-4 h-4" /> : <Table className="w-4 h-4" />}
        {label || (isCumulativeView ? detailedViewLabel : aggregatedViewLabel)}
    </Button>
);