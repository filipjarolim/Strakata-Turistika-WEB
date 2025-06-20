'use client';

import React from 'react';
import { IOSButton } from '@/components/ui/ios/button';
import { ListFilter, LayoutList } from 'lucide-react';

interface ToggleViewButtonProps {
    isAggregatedView: boolean;
    onToggleView: () => void;
    aggregatedViewLabel?: string;
    detailedViewLabel?: string;
}

export const ToggleViewButton = ({
    isAggregatedView,
    onToggleView,
    aggregatedViewLabel = "Přehled",
    detailedViewLabel = "Detaily",
}: ToggleViewButtonProps) => {
    return (
        <IOSButton
            variant="outline"
            size="sm"
            onClick={onToggleView}
            icon={isAggregatedView ? <LayoutList className="h-4 w-4" /> : <ListFilter className="h-4 w-4" />}
        >
            {isAggregatedView ? detailedViewLabel : aggregatedViewLabel}
        </IOSButton>
    );
};