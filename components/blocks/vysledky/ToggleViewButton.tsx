import React from 'react';
import { Button } from '@/components/ui/button';
import { ListFilter, LayoutList } from 'lucide-react';

export interface ToggleViewButtonProps {
    isAggregatedView: boolean;
    onToggleView: () => void;
    aggregatedViewLabel?: string;
    detailedViewLabel?: string;
}

export const ToggleViewButton: React.FC<ToggleViewButtonProps> = ({
    isAggregatedView,
    onToggleView,
    aggregatedViewLabel = "Přehled",
    detailedViewLabel = "Detaily",
}) => {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onToggleView}
            className="flex items-center gap-2"
        >
            {isAggregatedView ? (
                <>
                    <LayoutList className="h-4 w-4" />
                    {detailedViewLabel}
                </>
            ) : (
                <>
                    <ListFilter className="h-4 w-4" />
                    {aggregatedViewLabel}
                </>
            )}
        </Button>
    );
};