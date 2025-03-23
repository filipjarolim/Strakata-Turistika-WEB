"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Filter } from "lucide-react";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cs } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterButtonProps = {
    // Date filter handlers
    onDateFilterChange?: (
        filterType: "before" | "after" | "between",
        dates: [Date | undefined, Date | undefined]
    ) => void;
    // Number range filter handlers
    onNumberFilterChange?: (min?: number, max?: number) => void;
    // Custom filter handler
    onCustomFilterChange?: (filterParams: Record<string, unknown>) => void;
    // Clear filters
    onClearDateFilters?: () => void;
    onClearAllFilters?: () => void;
    // Config
    year?: number;
    dateFieldLabel?: string;
    numberFieldLabel?: string;
    customFilterOptions?: {
        label: string;
        options: { value: string; label: string }[];
    };
};

export const FilterButton: React.FC<FilterButtonProps> = ({ 
    onDateFilterChange, 
    onNumberFilterChange,
    onCustomFilterChange,
    onClearDateFilters, 
    onClearAllFilters,
    year = new Date().getFullYear(),
    dateFieldLabel = "Date",
    numberFieldLabel = "Value",
    customFilterOptions
}) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("date");
    
    // Date filter state
    const [filterType, setFilterType] = useState<"before" | "after" | "between">("before");
    const [startYear] = useState(new Date(year, 0, 1)); // Start in year
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(year, 0, 1),
        to: addDays(new Date(year, 0, 1), 7), // Default range within year
    });
    const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(startYear);

    // Number filter state
    const [minValue, setMinValue] = useState<string>("");
    const [maxValue, setMaxValue] = useState<string>("");

    // Custom filter state
    const [selectedCustomValues, setSelectedCustomValues] = useState<string[]>([]);

    const handleApplyFilter = () => {
        switch (activeTab) {
            case "date":
                if (onDateFilterChange) {
                    if (filterType === "between") {
                        onDateFilterChange(filterType, [dateRange?.from, dateRange?.to]);
                    } else {
                        onDateFilterChange(filterType, [selectedSingleDate, undefined]);
                    }
                }
                break;
            case "number":
                if (onNumberFilterChange) {
                    const min = minValue ? parseFloat(minValue) : undefined;
                    const max = maxValue ? parseFloat(maxValue) : undefined;
                    onNumberFilterChange(min, max);
                }
                break;
            case "custom":
                if (onCustomFilterChange && selectedCustomValues.length > 0) {
                    onCustomFilterChange({ categories: selectedCustomValues });
                }
                break;
        }
        setIsPopoverOpen(false);
    };

    const handleClearFilter = () => {
        // Reset all filter states
        setFilterType("before");
        setDateRange(undefined);
        setSelectedSingleDate(undefined);
        setMinValue("");
        setMaxValue("");
        setSelectedCustomValues([]);

        // Call parent's callback to clear filters
        if (activeTab === "date" && onClearDateFilters) {
            onClearDateFilters();
        } else if (onClearAllFilters) {
            onClearAllFilters();
        }

        setIsPopoverOpen(false); // Close the popover
    };

    const handleToggleCustomValue = (value: string) => {
        if (selectedCustomValues.includes(value)) {
            setSelectedCustomValues(selectedCustomValues.filter(v => v !== value));
        } else {
            setSelectedCustomValues([...selectedCustomValues, value]);
        }
    };

    // Determine which tabs to show based on provided handlers
    const showDateTab = !!onDateFilterChange;
    const showNumberTab = !!onNumberFilterChange;
    const showCustomTab = !!onCustomFilterChange && !!customFilterOptions;

    // If no tabs would be shown, don't render the component
    if (!showDateTab && !showNumberTab && !showCustomTab) {
        return null;
    }

    return (
        <Popover modal={false} open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit">
                <Tabs defaultValue="date" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full mb-4">
                        {showDateTab && <TabsTrigger value="date">{dateFieldLabel}</TabsTrigger>}
                        {showNumberTab && <TabsTrigger value="number">{numberFieldLabel}</TabsTrigger>}
                        {showCustomTab && <TabsTrigger value="custom">{customFilterOptions?.label}</TabsTrigger>}
                    </TabsList>

                    {/* Date Filter Tab */}
                    {showDateTab && (
                        <TabsContent value="date" className="space-y-4 w-fit">
                            {/* Filter type selection */}
                            <div>
                                <Select
                                    value={filterType}
                                    onValueChange={(value) => setFilterType(value as "before" | "after" | "between")}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select filter type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="before">Before date</SelectItem>
                                        <SelectItem value="after">After date</SelectItem>
                                        <SelectItem value="between">Between dates</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Calendar for date selection */}
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {filterType === "between" ? "Date range" : "Select date"}
                                </p>
                                {filterType === "between" ? (
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        defaultMonth={startYear}
                                        numberOfMonths={2} // Show 2 months for range
                                        locale={cs} // Localization
                                    />
                                ) : (
                                    <Calendar
                                        mode="single"
                                        selected={selectedSingleDate}
                                        onSelect={setSelectedSingleDate}
                                        defaultMonth={startYear}
                                        numberOfMonths={1} // Single month for before/after
                                        locale={cs} // Localization
                                    />
                                )}
                            </div>
                        </TabsContent>
                    )}

                    {/* Number Filter Tab */}
                    {showNumberTab && (
                        <TabsContent value="number" className="space-y-4 w-64">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-muted-foreground">Min</label>
                                    <Input
                                        type="number"
                                        value={minValue}
                                        onChange={(e) => setMinValue(e.target.value)}
                                        placeholder="Min value"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Max</label>
                                    <Input
                                        type="number"
                                        value={maxValue}
                                        onChange={(e) => setMaxValue(e.target.value)}
                                        placeholder="Max value"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    )}

                    {/* Custom Filter Tab */}
                    {showCustomTab && customFilterOptions && (
                        <TabsContent value="custom" className="space-y-4 w-64">
                            <div className="space-y-2">
                                {customFilterOptions.options.map((option) => (
                                    <div key={option.value} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={option.value}
                                            className="mr-2"
                                            checked={selectedCustomValues.includes(option.value)}
                                            onChange={() => handleToggleCustomValue(option.value)}
                                        />
                                        <label htmlFor={option.value}>{option.label}</label>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    )}

                    {/* Footer with Apply and Clear buttons */}
                    <div className="flex gap-2 mt-4">
                        <Button
                            onClick={handleApplyFilter}
                            disabled={
                                (activeTab === "date" && filterType === "between" && (!dateRange?.from || !dateRange?.to)) ||
                                (activeTab === "date" && (filterType === "before" || filterType === "after") && !selectedSingleDate) ||
                                (activeTab === "number" && !minValue && !maxValue) ||
                                (activeTab === "custom" && selectedCustomValues.length === 0)
                            }
                        >
                            Apply Filter
                        </Button>
                        <Button variant="secondary" onClick={handleClearFilter}>
                            Clear Filters
                        </Button>
                    </div>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
};