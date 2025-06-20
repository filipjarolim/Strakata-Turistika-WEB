import React, { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { IOSSlidePanel } from './slide-panel';
import { IOSButton } from './button';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectRangeEventHandler } from 'react-day-picker';

interface IOSDatePickerProps {
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    label?: string;
    mode?: 'single' | 'range';
    fromDate?: Date;
    toDate?: Date;
    className?: string;
    disabled?: boolean;
}

export const IOSDatePicker = ({
    value,
    onChange,
    placeholder = 'Vybrat datum',
    label,
    mode = 'single',
    fromDate,
    toDate,
    className,
    disabled = false
}: IOSDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [rangeValue, setRangeValue] = useState<{ from?: Date; to?: Date } | undefined>(undefined);

    const handleSelectSingle = (date: Date | undefined) => {
        onChange?.(date);
        setIsOpen(false);
    };

    const handleSelectRange: SelectRangeEventHandler = (range) => {
        setRangeValue(range);
        onChange?.(range?.from);
    };

    const formattedDate = value ? format(value, 'd. MMMM yyyy', { locale: cs }) : placeholder;

    return (
        <div className={cn("relative", className)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <IOSButton
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                disabled={disabled}
                className="w-full justify-start text-left font-normal"
                icon={<CalendarDays className="h-4 w-4 text-gray-500" />}
            >
                <span className={cn(
                    "flex-1",
                    !value && "text-gray-500"
                )}>
                    {formattedDate}
                </span>
            </IOSButton>

            <IOSSlidePanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                side="left"
                className="p-4 bg-white/80 backdrop-blur-lg"
            >
                <div className="space-y-4">
                    {mode === 'single' ? (
                        <Calendar
                            mode="single"
                            selected={value}
                            onSelect={handleSelectSingle}
                            fromDate={fromDate}
                            toDate={toDate}
                            className="rounded-2xl border shadow-sm bg-white"
                        />
                    ) : (
                        <Calendar
                            mode="range"
                            selected={rangeValue && rangeValue.from ? (rangeValue as { from: Date; to?: Date }) : undefined}
                            onSelect={handleSelectRange}
                            fromDate={fromDate}
                            toDate={toDate}
                            className="rounded-2xl border shadow-sm bg-white"
                        />
                    )}
                    
                    <div className="flex gap-2">
                        <IOSButton
                            variant="outline"
                            onClick={() => {
                                onChange?.(undefined);
                                setIsOpen(false);
                            }}
                            className="flex-1"
                        >
                            Vymazat
                        </IOSButton>
                        <IOSButton
                            onClick={() => setIsOpen(false)}
                            className="flex-1"
                        >
                            Hotovo
                        </IOSButton>
                    </div>
                </div>
            </IOSSlidePanel>
        </div>
    );
}; 