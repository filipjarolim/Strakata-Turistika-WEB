"use client";

import React, { useState } from "react";
import { Filter } from "lucide-react";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSSlidePanel } from "@/components/ui/ios/slide-panel";
import { IOSSelect } from "@/components/ui/ios/select";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { cn } from "@/lib/utils";

interface FilterButtonProps {
    onDateFilterChange: (type: 'before' | 'after' | 'between', dates: [Date | undefined, Date | undefined]) => void;
    onNumberFilterChange: (min?: number, max?: number) => void;
    onCustomFilterChange: (filterParams: Record<string, unknown>) => void;
    onClearAllFilters: () => void;
    year?: number;
    dateFieldLabel?: string;
    numberFieldLabel?: string;
    showDateFilter?: boolean;
    showNumberFilter?: boolean;
}

export const FilterButton = ({
    onDateFilterChange,
    onNumberFilterChange,
    onCustomFilterChange,
    onClearAllFilters,
    year,
    dateFieldLabel = "Datum",
    numberFieldLabel = "Hodnota",
    showDateFilter = true,
    showNumberFilter = true,
}: FilterButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dateFilterType, setDateFilterType] = useState<'before' | 'after' | 'between'>('between');
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [minPoints, setMinPoints] = useState<string>('');
    const [maxPoints, setMaxPoints] = useState<string>('');

    const handleApplyFilters = () => {
        if (showDateFilter) {
            onDateFilterChange(dateFilterType, [startDate, endDate]);
        }
        if (showNumberFilter) {
            onNumberFilterChange(
                minPoints ? parseInt(minPoints) : undefined,
                maxPoints ? parseInt(maxPoints) : undefined
            );
        }
        setIsOpen(false);
    };

    const handleClearFilters = () => {
        setDateFilterType('between');
        setStartDate(undefined);
        setEndDate(undefined);
        setMinPoints('');
        setMaxPoints('');
        onClearAllFilters();
        setIsOpen(false);
    };

    return (
        <>
            <IOSButton
                variant="outline"
                size="sm"
                icon={<Filter className="h-4 w-4" />}
                onClick={() => setIsOpen(true)}
            >
                Filtrovat
            </IOSButton>

            <IOSSlidePanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                side="right"
                className="bg-white/80 backdrop-blur-lg border-l"
            >
                <div className="p-4 border-b bg-white/50">
                    <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
                    <p className="text-sm text-gray-500">Nastavte filtry pro zobrazení výsledků</p>
                </div>

                <div className="space-y-6 p-4">
                    {showDateFilter && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">{dateFieldLabel}</h3>
                            <IOSSelect
                                value={dateFilterType}
                                onChange={(value) => setDateFilterType(value as 'before' | 'after' | 'between')}
                                options={[
                                    { value: 'before', label: 'Před datem' },
                                    { value: 'after', label: 'Po datu' },
                                    { value: 'between', label: 'Mezi daty' },
                                ]}
                            />
                            <div className="space-y-2">
                                <IOSTextInput
                                    type="date"
                                    value={startDate?.toISOString().split('T')[0] || ''}
                                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                                    label={dateFilterType === 'between' ? 'Od' : 'Datum'}
                                />
                                {dateFilterType === 'between' && (
                                    <IOSTextInput
                                        type="date"
                                        value={endDate?.toISOString().split('T')[0] || ''}
                                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                                        label="Do"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {showNumberFilter && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-900">{numberFieldLabel}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <IOSTextInput
                                    type="number"
                                    value={minPoints}
                                    onChange={(e) => setMinPoints(e.target.value)}
                                    placeholder="Min"
                                    label="Minimum"
                                />
                                <IOSTextInput
                                    type="number"
                                    value={maxPoints}
                                    onChange={(e) => setMaxPoints(e.target.value)}
                                    placeholder="Max"
                                    label="Maximum"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <IOSButton
                            variant="outline"
                            onClick={handleClearFilters}
                            className="flex-1"
                        >
                            Vymazat
                        </IOSButton>
                        <IOSButton
                            onClick={handleApplyFilters}
                            className="flex-1"
                        >
                            Použít
                        </IOSButton>
                    </div>
                </div>
            </IOSSlidePanel>
        </>
    );
};