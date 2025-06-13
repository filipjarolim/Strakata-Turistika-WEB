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

export type FilterButtonProps = {
    onDateFilterChange: (filterType: 'before' | 'after' | 'between', dates: [Date | undefined, Date | undefined]) => void;
    onNumberFilterChange: (min?: number, max?: number) => void;
    onCustomFilterChange: (filterParams: Record<string, unknown>) => void;
    onClearAllFilters: () => void;
    year?: number;
    dateFieldLabel?: string;
    numberFieldLabel?: string;
    customFilterOptions?: {
        label: string;
        options: { value: string; label: string }[];
    };
    showDateFilter?: boolean;  // Add this prop
    showNumberFilter?: boolean;  // Add this prop
};

export const FilterButton: React.FC<FilterButtonProps> = ({ 
    onDateFilterChange, 
    onNumberFilterChange,
    onCustomFilterChange,
    onClearAllFilters,
    year = new Date().getFullYear(),
    dateFieldLabel = "Date",
    numberFieldLabel = "Value",
    customFilterOptions,
    showDateFilter = true,
    showNumberFilter = true,
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
        if (onClearAllFilters) {
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
    const showDateTab = !!onDateFilterChange && showDateFilter;
    const showNumberTab = !!onNumberFilterChange && showNumberFilter;
    const showCustomTab = !!onCustomFilterChange && !!customFilterOptions;

    // If no tabs would be shown, don't render the component
    if (!showDateTab && !showNumberTab && !showCustomTab) {
        return null;
    }

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filtrovat</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white" align="end">
                <div className="p-4 border-b">
                    <h3 className="font-medium mb-1">Filtry</h3>
                    <p className="text-sm text-muted-foreground">Vyberte způsob filtrování dat</p>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-3 p-1 m-1">
                        {showDateTab && (
                            <TabsTrigger value="date" className="text-xs">Datum</TabsTrigger>
                        )}
                        {showNumberTab && (
                            <TabsTrigger value="number" className="text-xs">Body</TabsTrigger>
                        )}
                        {customFilterOptions && (
                            <TabsTrigger value="custom" className="text-xs">
                                {customFilterOptions.label || "Kategorie"}
                            </TabsTrigger>
                        )}
                    </TabsList>
                    
                    {showDateTab && (
                        <TabsContent value="date" className="p-4 space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">{dateFieldLabel}</h4>
                                <Select
                                    value={filterType}
                                    onValueChange={(value: "before" | "after" | "between") => 
                                        setFilterType(value)
                                    }
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
                                
                                {filterType === "between" ? (
                                    <div className="rounded-md border p-2">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={setDateRange}
                                            initialFocus
                                            locale={cs}
                                            fromYear={year - 10}
                                            toYear={year + 1}
                                            defaultMonth={new Date(year, 0)}
                                        />
                                    </div>
                                ) : (
                                    <div className="rounded-md border p-2">
                                        <Calendar
                                            mode="single"
                                            selected={selectedSingleDate}
                                            onSelect={setSelectedSingleDate}
                                            initialFocus
                                            locale={cs}
                                            fromYear={year - 10}
                                            toYear={year + 1}
                                            defaultMonth={new Date(year, 0)}
                                        />
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    )}
                    
                    {showNumberTab && (
                        <TabsContent value="number" className="p-4 space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">{numberFieldLabel}</h4>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Minimum"
                                        value={minValue}
                                        onChange={(e) => setMinValue(e.target.value)}
                                        className="w-1/2"
                                    />
                                    <span className="text-muted-foreground">–</span>
                                    <Input
                                        type="number"
                                        placeholder="Maximum"
                                        value={maxValue}
                                        onChange={(e) => setMaxValue(e.target.value)}
                                        className="w-1/2"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    )}
                    
                    {customFilterOptions && (
                        <TabsContent value="custom" className="p-4 space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium">{customFilterOptions.label}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {customFilterOptions.options.map((option) => (
                                        <Button 
                                            key={option.value}
                                            variant={selectedCustomValues.includes(option.value) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleToggleCustomValue(option.value)}
                                            className="rounded-full"
                                        >
                                            {option.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
                
                <div className="border-t p-3 flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleClearFilter}
                    >
                        Vymazat
                    </Button>
                    <Button 
                        onClick={handleApplyFilter}
                    >
                        Použít filtr
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};