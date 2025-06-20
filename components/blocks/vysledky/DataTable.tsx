'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    ColumnDef,
    Row,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SearchFilterInput } from './SearchFilterInput';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { PaginationControls } from './PaginationControls';
import { DownloadDataButton } from './DownloadDataButton';
import { ToggleViewButton } from './ToggleViewButton';
import { FilterButton } from './FilterButton';
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Filter, Download, Table as TableIcon, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { IOSCard } from '@/components/ui/ios/card';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSBadge } from '@/components/ui/ios/badge';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSSelect } from '@/components/ui/ios/select';

export interface VisitData {
    id: string;
    visitDate: string | null;
    points: number;
    visitedPlaces: string;
    dogNotAllowed: string | null;
    routeLink: string | null;
    routeTitle: string | null;
    routeDescription: string | null;
    dogName: string | null;
    year: number;
    extraPoints: {
        description: string;
        distance: number;
        elapsedTime: number;
        averageSpeed: number;
    };
    state: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string | null;
    createdAt?: string | null;
    photos?: { url: string; public_id: string; title: string }[];
    route: string; // JSON string from schema
    user?: {
        name: string | null;
        dogName: string | null;
    } | null;
}

export interface AggregatedVisitData {
    year: number;
    totalPoints: number;
    visitCount: number;
    visitedPlaces: Set<string>;
    dogNotAllowed: Set<string>;
    routeTitles: Set<string>;
}

export interface FilterConfig<T> {
    dateField?: keyof T;
    numberField?: keyof T;
    customFilter?: (item: T, filters: Record<string, unknown>) => boolean;
}

// Define types for filter parameters
type CustomFilterParams = {
    categories?: string[];
    [key: string]: unknown;
};

type DateFilter = {
    type: 'before' | 'after' | 'between';
    startDate?: Date;
    endDate?: Date;
};

type NumberFilter = {
    min?: number;
    max?: number;
};

type FilterState = {
    dateFilter?: DateFilter;
    numberFilter?: NumberFilter;
    customFilterParams?: CustomFilterParams;
};

const ROWS_PER_PAGE = 10;

export interface DataTableProps<TData extends { id: string }> {
    data: TData[];
    columns: ColumnDef<TData>[];
    year?: number;
    primarySortColumn?: string;
    primarySortDesc?: boolean;
    transformToAggregatedView?: (data: TData[]) => AggregatedVisitData[];
    filterConfig?: FilterConfig<TData>;
    filename?: string;
    enableDownload?: boolean;
    enableAggregatedView?: boolean;
    aggregatedViewLabel?: string;
    detailedViewLabel?: string;
    enableColumnVisibility?: boolean;
    enableSearch?: boolean;
    excludedColumnsInAggregatedView?: string[];
    mainSheetName?: string;
    summarySheetName?: string;
    generateSummarySheet?: boolean;
    loading?: boolean;
    emptyStateMessage?: string;
}

export const columns: ColumnDef<VisitData>[] = [
    {
        accessorKey: "visitDate",
        header: "Datum návštěvy",
        cell: ({ row }) => {
            const date = row.getValue("visitDate") as string;
            return date ? format(new Date(date), "d. MMMM yyyy", { locale: cs }) : "-";
        },
    },
    {
        accessorKey: "routeTitle",
        header: "Název trasy",
        cell: ({ row }) => row.getValue("routeTitle") || "-",
    },
    {
        accessorKey: "points",
        header: "Body",
        cell: ({ row }) => row.getValue("points") || 0,
    },
    {
        accessorKey: "visitedPlaces",
        header: "Navštívená místa",
        cell: ({ row }) => row.getValue("visitedPlaces") || "-",
    },
    {
        accessorKey: "dogNotAllowed",
        header: "Psi zakázáni",
        cell: ({ row }) => row.getValue("dogNotAllowed") === "true" ? "Ano" : "Ne",
    },
    {
        accessorKey: "state",
        header: "Stav",
        cell: ({ row }) => {
            const state = row.getValue("state") as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
            let label = state;

            switch (state) {
                case "DRAFT":
                    variant = "secondary";
                    label = "Koncept";
                    break;
                case "PENDING_REVIEW":
                    variant = "outline";
                    label = "Čeká na schválení";
                    break;
                case "APPROVED":
                    variant = "default";
                    label = "Schváleno";
                    break;
                case "REJECTED":
                    variant = "destructive";
                    label = "Zamítnuto";
                    break;
            }

            return <Badge variant={variant}>{label}</Badge>;
        },
    },
];

// Add this function to transform data for aggregated view - with better typing
export const transformDataToAggregated = (data: VisitData[]): AggregatedVisitData[] => {
    const aggregated = data.reduce((acc, item) => {
        const key = item.year.toString();
        if (!acc[key]) {
            acc[key] = {
                year: item.year,
                totalPoints: 0,
                visitCount: 0, 
                visitedPlaces: new Set<string>(),
                dogNotAllowed: new Set<string>(),
                routeTitles: new Set<string>()
            };
        }
        
        acc[key].totalPoints += item.points;
        acc[key].visitCount += 1;
        if (item.visitedPlaces) acc[key].visitedPlaces.add(item.visitedPlaces);
        if (item.dogNotAllowed) acc[key].dogNotAllowed.add(item.dogNotAllowed);
        if (item.routeTitle) acc[key].routeTitles.add(item.routeTitle);
        
        return acc;
    }, {} as Record<string, AggregatedVisitData>);
    
    return Object.values(aggregated);
};

export const summaryColumnDefinitions: ColumnDef<AggregatedVisitData>[] = [
    {
        accessorKey: "year",
        header: "Rok",
        cell: ({ row }) => row.getValue("year"),
    },
    {
        accessorKey: "totalPoints",
        header: "Celkem bodů",
        cell: ({ row }) => row.getValue("totalPoints"),
    },
    {
        accessorKey: "visitCount",
        header: "Počet návštěv",
        cell: ({ row }) => row.getValue("visitCount"),
    },
    {
        accessorKey: "visitedPlaces",
        header: "Navštívená místa",
        cell: ({ row }) => {
            const places = row.getValue("visitedPlaces") as Set<string>;
            return Array.from(places).join(", ") || "-";
        },
    },
    {
        accessorKey: "dogNotAllowed",
        header: "Psi zakázáni",
        cell: ({ row }) => {
            const restrictions = row.getValue("dogNotAllowed") as Set<string>;
            return Array.from(restrictions).join(", ") || "-";
        },
    },
    {
        accessorKey: "routeTitles",
        header: "Trasy",
        cell: ({ row }) => {
            const titles = row.getValue("routeTitles") as Set<string>;
            return Array.from(titles).join(", ") || "-";
        },
    },
];

export const DataTable = <TData extends { id: string }>({
    data,
    columns,
    year,
    primarySortColumn,
    primarySortDesc = false,
    transformToAggregatedView,
    filterConfig,
    filename,
    enableDownload = false,
    enableAggregatedView = false,
    aggregatedViewLabel = "Aggregated View",
    detailedViewLabel = "Detailed View",
    enableColumnVisibility = false,
    enableSearch = false,
    excludedColumnsInAggregatedView = [],
    mainSheetName = "Data",
    summarySheetName = "Summary",
    generateSummarySheet = false,
    loading = false,
    emptyStateMessage = "No data available"
}: DataTableProps<TData>) => {
    const initialSorting: SortingState = primarySortColumn 
        ? [{ id: primarySortColumn, desc: primarySortDesc }] 
        : [];

    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [isAggregatedView, setIsAggregatedView] = useState(false);
    const [filteredData, setFilteredData] = useState<TData[]>(data);
    const [activeFilters, setActiveFilters] = useState<FilterState>({});
    const [activeFilterCount, setActiveFilterCount] = useState<number>(0);

    // Update filtered data when the source data changes
    useEffect(() => {
        setFilteredData(data);
    }, [data]);

    const isColumnVisible = useCallback((columnId: string) => {
        return columnVisibility[columnId] !== false;
    }, [columnVisibility]);

    useEffect(() => {
        let count = 0;
        if (activeFilters.dateFilter && 
            filterConfig?.dateField && 
            isColumnVisible(filterConfig.dateField as string)) count++;
        if (activeFilters.numberFilter && 
            filterConfig?.numberField && 
            isColumnVisible(filterConfig.numberField as string)) count++;
        if (activeFilters.customFilterParams?.categories && activeFilters.customFilterParams.categories.length > 0) count++;
        setActiveFilterCount(count);
    }, [activeFilters, columnVisibility, isAggregatedView, filterConfig?.dateField, filterConfig?.numberField, isColumnVisible]);

    const handleToggleView = () => {
        const newAggregatedState = !isAggregatedView;
        setIsAggregatedView(newAggregatedState);
        
        // Clear filters for columns that will be hidden
        const updatedFilters: FilterState = { ...activeFilters };
        
        if (newAggregatedState) {
            if (filterConfig?.dateField && 
                excludedColumnsInAggregatedView.includes(filterConfig.dateField as string)) {
                delete updatedFilters.dateFilter;
            }
            // Similarly for other filter types...
        }
        
        setActiveFilters(updatedFilters);
        setFilteredData(data); // Reset to unfiltered data
    };

    const filteredColumns = useMemo(() => {
        if (isAggregatedView && excludedColumnsInAggregatedView.length > 0) {
            return columns.filter(
                (col) =>
                    'accessorKey' in col &&
                    col.accessorKey &&
                    !excludedColumnsInAggregatedView.includes(col.accessorKey as string)
            );
        }
        return columns;
    }, [isAggregatedView, columns, excludedColumnsInAggregatedView]);

    const memoizedData = useMemo(
        () => {
            if (isAggregatedView) {
                if (transformToAggregatedView) {
                    return transformToAggregatedView(filteredData);
                }
                // Use our own transform function as fallback
                return transformDataToAggregated(filteredData as unknown as VisitData[]);
            }
            return filteredData;
        },
        [isAggregatedView, filteredData, transformToAggregatedView]
    );

    // Create special columns for aggregated view if needed
    const aggregatedColumns = useMemo(() => {
        if (!isAggregatedView) return filteredColumns;

        // For VisitData specifically we might want to add custom columns
        const isVisitData = data.length > 0 && 'visitDate' in data[0] && 'fullName' in data[0];
        
        if (isVisitData) {
            // Use full column definition to avoid type issues
            const totalVisitsColumn: ColumnDef<TData> = {
                id: 'totalVisits',
                accessorFn: (row) => {
                    const visits = 'totalVisits' in row ? (row as { totalVisits: number }).totalVisits : 0;
                    return visits ? Number(visits) : 0;
                },
                header: 'Celkem návštěv',
                cell: ({ row }) => {
                    const totalVisits = row.getValue('totalVisits') as number;
                    return (
                        <div className="text-center">
                            <Badge variant="outline" className="py-0.5 px-2">
                                {totalVisits}
                            </Badge>
                        </div>
                    );
                }
            };

            // Start with base columns that are common in both views
            const baseColumns = filteredColumns.filter(
                (col) => 'accessorKey' in col && 
                        col.accessorKey && 
                        !excludedColumnsInAggregatedView.includes(col.accessorKey as string)
            );

            return [...baseColumns, totalVisitsColumn];
        }

        return filteredColumns;
    }, [isAggregatedView, filteredColumns, data, excludedColumnsInAggregatedView]);

    // Generic date filter handler
    const handleDateFilterChange = (
        filterType: 'before' | 'after' | 'between',
        dates: [Date | undefined, Date | undefined]
    ) => {
        if (!filterConfig?.dateField) return;

        const [startDate, endDate] = dates;
        const dateField = filterConfig.dateField as keyof TData;
        
        // Update active filters
        setActiveFilters(prev => ({
            ...prev,
            dateFilter: {
                type: filterType,
                startDate,
                endDate
            }
        }));

        applyFilters({
            ...activeFilters,
            dateFilter: {
                type: filterType,
                startDate,
                endDate
            }
        });
    };

    // Apply all filters
    const applyFilters = (filters: FilterState) => {
        let result = [...data];

        // Apply date filter if configured
        if (filters.dateFilter && filterConfig?.dateField) {
            const { type, startDate, endDate } = filters.dateFilter;
            const dateField = filterConfig.dateField as keyof TData;

            result = result.filter((item: TData) => {
                if (!item[dateField]) return false;
                const itemDate = new Date(item[dateField] as string);

                if (type === 'before') {
                    return startDate && itemDate < startDate;
                }
                if (type === 'after') {
                    return startDate && itemDate > startDate;
                }
                if (type === 'between') {
                    return startDate && endDate && itemDate >= startDate && itemDate <= endDate;
                }
                return false;
            });
        }

        // Apply number range filter if configured
        if (filters.numberFilter && filterConfig?.numberField) {
            const { min, max } = filters.numberFilter;
            const numberField = filterConfig.numberField as keyof TData;

            result = result.filter((item: TData) => {
                const value = parseFloat(String(item[numberField]));
                if (isNaN(value)) return false;
                
                if (min !== undefined && max !== undefined) {
                    return value >= min && value <= max;
                } else if (min !== undefined) {
                    return value >= min;
                } else if (max !== undefined) {
                    return value <= max;
                }
                return true;
            });
        }

        // Apply custom filter if provided
        if (filterConfig?.customFilter && filters.customFilterParams) {
            const customFilter = filterConfig.customFilter;
            result = result.filter(item => 
                customFilter(item, filters.customFilterParams as Record<string, unknown>)
            );
        }

        setFilteredData(result);
    };

    const handleNumberFilterChange = (min?: number, max?: number) => {
        if (!filterConfig?.numberField) return;

        // Update active filters
        setActiveFilters(prev => ({
            ...prev,
            numberFilter: { min, max }
        }));

        applyFilters({
            ...activeFilters,
            numberFilter: { min, max }
        });
    };

    const handleCustomFilterChange = (filterParams: Record<string, unknown>) => {
        if (!filterConfig?.customFilter) return;

        // Update active filters
        setActiveFilters(prev => ({
            ...prev,
            customFilterParams: filterParams
        }));

        applyFilters({
            ...activeFilters,
            customFilterParams: filterParams
        });
    };

    const handleClearFilters = () => {
        setActiveFilters({});
        setFilteredData(data);
    };

    const handleSortingChange = useCallback(
        (newSorting: React.SetStateAction<SortingState>) => setSorting(newSorting),
        []
    );
    const handleColumnVisibilityChange = useCallback(
        (newVisibility: React.SetStateAction<VisibilityState>) => setColumnVisibility(newVisibility),
        []
    );
    const handleGlobalFilterChange = useCallback(
        (newFilterValue: React.SetStateAction<string>) => setGlobalFilter(newFilterValue),
        []
    );

    const table = useReactTable<TData>({
        data: memoizedData as TData[],
        columns: isAggregatedView ? aggregatedColumns : filteredColumns,
        state: {
            sorting,
            columnVisibility,
            globalFilter,
        },
        onSortingChange: handleSortingChange,
        onColumnVisibilityChange: handleColumnVisibilityChange,
        onGlobalFilterChange: handleGlobalFilterChange,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: {
            pagination: {
                pageSize: ROWS_PER_PAGE,
            },
        },
    });

    // Backwards compatibility for VisitData
    const isVisitData = data.length > 0 && 'visitDate' in data[0] && 'fullName' in data[0];
    const showDateFilter = isVisitData || !!filterConfig?.dateField;

    // Calculate if the table is empty
    const isTableEmpty = table.getRowModel().rows.length === 0;

    return (
        <div className="w-full space-y-6">
            <IOSCard variant="elevated" className="backdrop-blur-md">
                {/* Controls Section */}
                <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        {enableSearch && (
                            <div className="w-full sm:w-[300px]">
                                <SearchFilterInput
                                    placeholder="Hledat v tabulce..." 
                                    value={globalFilter ?? ''}
                                    onChange={(value) => setGlobalFilter(value)}
                                    className="w-full"
                                />
                            </div>
                        )}
                        
                        {filterConfig && !isAggregatedView && (
                            <div className="relative w-full sm:w-auto">
                                <FilterButton
                                    onDateFilterChange={handleDateFilterChange}
                                    onNumberFilterChange={handleNumberFilterChange}
                                    onCustomFilterChange={handleCustomFilterChange}
                                    onClearAllFilters={handleClearFilters}
                                    year={year}
                                    dateFieldLabel="Datum návštěvy"
                                    numberFieldLabel="Body"
                                    showDateFilter={filterConfig.dateField ? isColumnVisible(filterConfig.dateField as string) : false}
                                    showNumberFilter={filterConfig.numberField ? isColumnVisible(filterConfig.numberField as string) : false}
                                />
                                {activeFilterCount > 0 && (
                                        <IOSBadge
                                            label={`${activeFilterCount}`}
                                            size="md"
                                            className={cn(
                                                "absolute -top-2 -right-2",
                                                activeFilterCount > 0 ? "bg-primary" : "bg-gray-400"
                                            )}
                                        />
                                )}
                            </div>
                        )}
                    </div>

                        {/* View Controls */}
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
                        {enableColumnVisibility && (
                                <IOSButton
                                    variant="outline"
                                    size="sm"
                                    icon={<TableIcon className="h-4 w-4" />}
                                    onClick={() => {
                                        // Open column visibility menu
                                    }}
                                >
                                    Sloupce
                                </IOSButton>
                        )}
                        
                        {enableAggregatedView && (
                                <IOSButton
                                    variant="outline"
                                    size="sm"
                                    icon={isAggregatedView ? <TableIcon className="h-4 w-4" /> : <List className="h-4 w-4" />}
                                    onClick={handleToggleView}
                                >
                                    {isAggregatedView ? detailedViewLabel : aggregatedViewLabel}
                                </IOSButton>
                        )}
                        
                        {enableDownload && (
                                <IOSButton
                                    variant="outline"
                                    size="sm"
                                    icon={<Download className="h-4 w-4" />}
                                    onClick={() => {
                                        // Handle download
                                    }}
                                >
                                    Stáhnout
                                </IOSButton>
                        )}
                    </div>
                </div>

                    {/* Active Filters */}
                    <AnimatePresence>
                {(activeFilters.dateFilter || activeFilters.numberFilter || activeFilters.customFilterParams?.categories?.length) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-wrap gap-2 items-center pt-2 border-t"
                            >
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                                <span className="text-sm font-medium text-muted-foreground">Aktivní filtry:</span>
                                
                                {activeFilters.dateFilter && (
                                        <IOSBadge
                                            label={`Datum: ${activeFilters.dateFilter.type === 'before' ? 'Před ' : 
                                         activeFilters.dateFilter.type === 'after' ? 'Po ' : 'Mezi '}
                                                   ${activeFilters.dateFilter.startDate?.toLocaleDateString('cs-CZ')}
                                                   ${activeFilters.dateFilter.type === 'between' && activeFilters.dateFilter.endDate ? 
                                                   ` - ${activeFilters.dateFilter.endDate.toLocaleDateString('cs-CZ')}` : ''}`}
                                            bgColor="bg-blue-100"
                                            textColor="text-blue-900"
                                            borderColor="border-blue-200"
                                        />
                                )}
                                
                                {activeFilters.numberFilter && (
                                        <IOSBadge
                                            label={`Body: ${activeFilters.numberFilter.min !== undefined ? 
                                                   `min ${activeFilters.numberFilter.min}` : ''}
                                                   ${activeFilters.numberFilter.min !== undefined && 
                                                   activeFilters.numberFilter.max !== undefined ? ' - ' : ''}
                                                   ${activeFilters.numberFilter.max !== undefined ? 
                                                   `max ${activeFilters.numberFilter.max}` : ''}`}
                                            bgColor="bg-blue-100"
                                            textColor="text-blue-900"
                                            borderColor="border-blue-200"
                                        />
                                )}
                                
                                {activeFilters.customFilterParams?.categories && 
                                 activeFilters.customFilterParams.categories.length > 0 && (
                                        <IOSBadge
                                            label={`Kategorie: ${activeFilters.customFilterParams.categories.join(', ')}`}
                                            bgColor="bg-blue-100"
                                            textColor="text-blue-900"
                                            borderColor="border-blue-200"
                                        />
                                    )}
                                    
                                    <IOSButton
                                        variant="outline"
                                        size="sm"
                                    onClick={handleClearFilters}
                                >
                                    Vymazat filtry
                                    </IOSButton>
                            </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
            </div>

                {/* Table Content */}
                {!loading ? (
                    <div className="overflow-x-auto">
                        <div className="min-w-full divide-y divide-gray-200">
                            {/* Header */}
                            <div className="bg-gray-50/50 sticky top-0 z-10">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <div key={headerGroup.id} className="flex">
                                        {headerGroup.headers.map(header => {
                                            const isSortable = header.column.getCanSort();
                                            return (
                                                <div
                                                key={header.id}
                                                    className={cn(
                                                        "flex-1 min-w-[150px] p-3 text-left text-sm font-medium text-gray-900",
                                                        isSortable && "cursor-pointer select-none",
                                                        header.column.getIsResizing() && "select-none"
                                                    )}
                                                    onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {isSortable && (
                                                            <div className="flex flex-col">
                                                                <ChevronUp className={cn(
                                                                    "h-3 w-3 -mb-1",
                                                                    header.column.getIsSorted() === "asc" ? "text-blue-600" : "text-gray-400"
                                                                )} />
                                                                <ChevronDown className={cn(
                                                                    "h-3 w-3",
                                                                    header.column.getIsSorted() === "desc" ? "text-blue-600" : "text-gray-400"
                                                                )} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Body */}
                            <div className="bg-white divide-y divide-gray-100">
                                {table.getRowModel().rows.length > 0 ? (
                                    table.getRowModel().rows.map(row => (
                                        <div
                                            key={row.id}
                                            className={cn(
                                                "flex hover:bg-gray-50/50 transition-colors",
                                                row.getIsSelected() && "bg-blue-50/50"
                                            )}
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <div
                                                    key={cell.id} 
                                                    className="flex-1 min-w-[150px] p-3 text-sm text-gray-900"
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-[400px] flex items-center justify-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <AlertCircle className="h-10 w-10 text-gray-400" />
                                            <p className="text-lg text-gray-500">
                                                    {emptyStateMessage}
                                                </p>
                                            </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[400px]">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm text-gray-500">Načítání dat...</p>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {table.getRowModel().rows?.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                    <PaginationControls
                        totalRows={table.getFilteredRowModel().rows.length}
                        pageIndex={table.getState().pagination.pageIndex}
                        pageSize={table.getState().pagination.pageSize}
                        pageSizeOptions={[10, 20, 50, 100]}
                        onPageChange={(page) => table.setPageIndex(page)}
                        onPageSizeChange={(size) => table.setPageSize(size)}
                    />
                </div>
            )}
            </IOSCard>
        </div>
    );
}