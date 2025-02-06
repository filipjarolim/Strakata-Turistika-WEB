"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cs } from "date-fns/locale";

type FilterButtonProps = {
    onDateFilterChange: (
        filterType: "before" | "after" | "between",
        dates: [Date | undefined, Date | undefined]
    ) => void;
    onClearDateFilters: () => void; // Focuses on clearing only date filters
    year: number;
};

export const FilterButton: React.FC<FilterButtonProps> = ({ onDateFilterChange, onClearDateFilters, year }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [filterType, setFilterType] = useState<"before" | "after" | "between">("before");
    const [startYear] = useState(new Date(year, 0, 1)); // Start in year
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(year, 0, 1),
        to: addDays(new Date(year, 0, 1), 7), // Default range within year
    });
    const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(startYear);

    const handleApplyFilter = () => {
        // Calls the parent component's callback to apply date filter
        if (filterType === "between") {
            onDateFilterChange(filterType, [dateRange?.from, dateRange?.to]);
        } else {
            onDateFilterChange(filterType, [selectedSingleDate, undefined]);
        }
        setIsPopoverOpen(false);
    };

    const handleClearFilter = () => {
        // Reset filter type and date-related states
        setFilterType("before");
        setDateRange(undefined);
        setSelectedSingleDate(undefined);

        // Call parent's callback to clear date filters
        onClearDateFilters();

        setIsPopoverOpen(false); // Close the popover
    };

    return (
        <Popover modal={false} open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <span>Filtr</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit">
                <div className="space-y-4 w-fit">
                    {/* Filter type selection */}
                    <div>
                        <Select
                            value={filterType}
                            onValueChange={(value) => setFilterType(value as "before" | "after" | "between")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Vyberte typ filtru" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="before">Před datem</SelectItem>
                                <SelectItem value="after">Po datu</SelectItem>
                                <SelectItem value="between">Mezi daty</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Calendar for date selection */}
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {filterType === "between" ? "Rozsah dat" : "Vyberte datum"}
                        </p>
                        {filterType === "between" ? (
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                defaultMonth={startYear}
                                numberOfMonths={2} // Show 2 months for range
                                locale={cs} // Localization here

                            />
                        ) : (
                            <Calendar
                                mode="single"
                                selected={selectedSingleDate}
                                onSelect={setSelectedSingleDate}
                                defaultMonth={startYear}
                                numberOfMonths={1} // Single month for before/after
                                locale={cs} // Localization here


                            />
                        )}
                    </div>

                    {/* Footer with Apply and Clear buttons */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handleApplyFilter}
                            disabled={
                                (filterType === "between" && (!dateRange?.from || !dateRange?.to)) ||
                                ((filterType === "before" || filterType === "after") && !selectedSingleDate)
                            }
                        >
                            Použít filtr
                        </Button>
                        <Button variant="secondary" onClick={handleClearFilter}>
                            Vymazat filtry data
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};