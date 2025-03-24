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
import { Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type VisitData = {
    id: string;
    visitDate?: string | null;
    fullName: string;
    dogName?: string | null;
    points: number;
    visitedPlaces: string;
    dogNotAllowed?: string | null;
    routeLink?: string | null;
    year: number;
};

export type FilterConfig<TData = unknown> = {
    dateField?: string;  // Field name to use for date filtering, like 'visitDate' or 'createdAt'
    numberField?: string; // Field name for number range filtering
    customFilter?: (data: TData, filters: Record<string, unknown>) => boolean; // Custom filter function
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

export type DataTableProps<TData extends object> = {
    data: TData[];
    columns: ColumnDef<TData>[];
    year?: number;
    primarySortColumn?: string;
    primarySortDesc?: boolean;
    transformToAggregatedView?: (data: TData[]) => TData[];
    filterConfig?: FilterConfig<TData>;
    filename?: string;
    enableDownload?: boolean;
    enableAggregatedView?: boolean;
    aggregatedViewLabel?: string; // E.g., "View by Category", "Cumulative View", etc.
    detailedViewLabel?: string; // Label for detailed view button
    enableColumnVisibility?: boolean;
    enableSearch?: boolean;
    excludedColumnsInAggregatedView?: string[];
    mainSheetName?: string;
    summarySheetName?: string;
    generateSummarySheet?: boolean;
    summaryColumnDefinitions?: {
        header: string;
        key: string;
        width?: number;
    }[];
    customFilterOptions?: {
        label: string;
        options: { value: string; label: string }[];
    };
    loading?: boolean;
    emptyStateMessage?: string;
};

// Define a type for the aggregated record
export type AggregatedVisitData = {
    fullName: string;
    points: number;
    visitedPlaces: string;
    totalVisits: number;
    isAggregated: boolean;
    // Include other fields that might be needed
    year?: number;
    id?: string;
};

// Add this function to transform data for aggregated view - with better typing
export const transformDataToAggregated = <TData extends { fullName: string; points: number; visitedPlaces?: string }>(
    data: TData[]
): any[] => {
    if (data.length === 0) return [];
    
    const cumulativeData: Record<string, { 
        points: number; 
        visitCount: number; 
        visitedPlaces: Set<string>;
        fullName: string;
    }> = {};
    
    // Group data by person's name
    data.forEach(item => {
        const fullName = item.fullName;
        if (!cumulativeData[fullName]) {
            cumulativeData[fullName] = { 
                points: 0, 
                visitCount: 0, 
                visitedPlaces: new Set<string>(),
                fullName
            };
        }
        
        // Accumulate points
        cumulativeData[fullName].points += item.points;
        
        // Count visits
        cumulativeData[fullName].visitCount += 1;
        
        // Collect unique visited places
        if (item.visitedPlaces) {
            const places = item.visitedPlaces.split(',').map(p => p.trim());
            places.forEach(place => {
                if (place) cumulativeData[fullName].visitedPlaces.add(place);
            });
        }
    });
    
    // Convert back to array and sort by points descending
    return Object.values(cumulativeData).map(stats => {
        // Create a new object with required fields to match expected type
        return {
            id: stats.fullName, // Use name as ID
            fullName: stats.fullName,
            points: stats.points,
            visitedPlaces: Array.from(stats.visitedPlaces).join(', '),
            // Add additional fields specific to aggregated view
            totalVisits: stats.visitCount,
            isAggregated: true,
            year: (data[0] as any).year
        } as AggregatedVisitData;
    }).sort((a, b) => b.points - a.points);
};

export function DataTable<TData extends object>({
    data,
    columns,
    year = new Date().getFullYear(),
    primarySortColumn,
    primarySortDesc = true,
    transformToAggregatedView,
    filterConfig,
    filename = `data-export-${year}`,
    enableDownload = true,
    enableAggregatedView = false,
    aggregatedViewLabel = "Aggregated View",
    detailedViewLabel,
    enableColumnVisibility = true,
    enableSearch = true,
    excludedColumnsInAggregatedView = [],
    mainSheetName,
    summarySheetName,
    generateSummarySheet,
    summaryColumnDefinitions,
    customFilterOptions,
    loading = false,
    emptyStateMessage = "No data available",
}: DataTableProps<TData>) {
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

    // Count active filters for UI feedback
    useEffect(() => {
        let count = 0;
        if (activeFilters.dateFilter) count++;
        if (activeFilters.numberFilter) count++;
        if (activeFilters.customFilterParams?.categories && activeFilters.customFilterParams.categories.length > 0) count++;
        setActiveFilterCount(count);
    }, [activeFilters]);

    const handleToggleView = () => {
        if (!isAggregatedView) {
            handleClearFilters();
        }
        setIsAggregatedView((prevValue) => !prevValue);
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
                return transformDataToAggregated(filteredData as any);
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
                    const visits = (row as any).totalVisits;
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
        const dateField = filterConfig.dateField;
        
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
            const dateField = filterConfig.dateField;

            result = result.filter((item: TData) => {
                if (!item[dateField as keyof TData]) return false;
                const itemDate = new Date(item[dateField as keyof TData] as string);

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
            const numberField = filterConfig.numberField;

            result = result.filter((item: TData) => {
                const value = parseFloat(String(item[numberField as keyof TData]));
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
            result = result.filter(item => 
                filterConfig.customFilter!(item, filters.customFilterParams || {})
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

    const table = useReactTable({
        data: memoizedData,
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
        <div className="w-full space-y-4">
            {/* Table Controls - flexbox layout that stacks on mobile */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {enableSearch && (
                        <div className="w-full sm:w-auto">
                        <SearchFilterInput
                                placeholder="Hledat..." 
                                value={globalFilter ?? ''}
                                onChange={(value) => setGlobalFilter(value)}
                                className="min-w-[200px] w-full sm:w-auto"
                            />
                        </div>
                    )}
                    
                    {/* Filter button with count indicator */}
                    {filterConfig && (
                        <div className="relative">
                            <FilterButton
                                onDateFilterChange={handleDateFilterChange}
                                onNumberFilterChange={handleNumberFilterChange}
                                onCustomFilterChange={handleCustomFilterChange}
                                onClearAllFilters={handleClearFilters}
                                year={year}
                                dateFieldLabel="Datum návštěvy"
                                numberFieldLabel="Body"
                                customFilterOptions={customFilterOptions}
                            />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {enableColumnVisibility && (
                        <ColumnVisibilityMenu
                            table={table}
                            isAggregatedView={isAggregatedView}
                        />
                    )}
                    
                    {enableAggregatedView && (
                        <ToggleViewButton
                            isAggregatedView={isAggregatedView}
                            onToggleView={handleToggleView}
                            aggregatedViewLabel={aggregatedViewLabel}
                            detailedViewLabel={detailedViewLabel}
                        />
                    )}
                    
                    {enableDownload && (
                        <DownloadDataButton 
                            data={filteredData}
                            columns={table.getAllColumns().filter(column => column.getIsVisible())}
                            filename={filename}
                            summarySheetName={summarySheetName}
                            mainSheetName={mainSheetName}
                            generateSummarySheet={generateSummarySheet}
                            summaryColumnDefinitions={summaryColumnDefinitions}
                        />
                    )}
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="w-full h-[400px] flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Načítání dat...</span>
                </div>
            )}
            
            {/* Table Container with shadow, rounded corners and fixed height/width */}
            {!loading && (
                <>
            <div className="rounded-md border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
                            <Table className="min-w-full table-fixed">
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className="hover:bg-muted/50">
                                    {headerGroup.headers.map((header) => (
                                                <TableHead 
                                                    key={header.id}
                                                    className="whitespace-nowrap font-medium text-muted-foreground py-3"
                                                    style={{
                                                        width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto',
                                                        maxWidth: header.column.columnDef.maxSize ? `${header.column.columnDef.maxSize}px` : undefined
                                                    }}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                                <TableBody className="relative">
                                    {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow 
                                        key={row.id} 
                                                data-state={row.getIsSelected() && "selected"}
                                                className="transition-colors hover:bg-muted/30"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell 
                                                key={cell.id} 
                                                className="py-2.5"
                                                style={{
                                                    width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto',
                                                    maxWidth: cell.column.columnDef.maxSize ? `${cell.column.columnDef.maxSize}px` : undefined
                                                }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={table.getAllColumns().length}
                                                className="h-[400px] text-center"
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <AlertCircle className="h-10 w-10 text-muted-foreground/60" />
                                                    <p className="text-lg text-muted-foreground">
                                                        {emptyStateMessage}
                                                    </p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

                    {/* Add pagination controls outside the table */}
                    {table.getRowModel().rows?.length > 0 && (
                <PaginationControls
                            totalRows={table.getFilteredRowModel().rows.length}
                            pageIndex={table.getState().pagination.pageIndex}
                            pageSize={table.getState().pagination.pageSize}
                            pageSizeOptions={[10, 20, 50, 100]}
                            onPageChange={(page) => {
                                table.setPageIndex(page);
                            }}
                            onPageSizeChange={(size) => {
                                table.setPageSize(size);
                            }}
                        />
                    )}
                </>
            )}

            {/* Active filters display (badges beneath the table) */}
            {(activeFilters.dateFilter || 
              activeFilters.numberFilter || 
              (activeFilters.customFilterParams?.categories && 
               activeFilters.customFilterParams.categories.length > 0)) && (
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium text-muted-foreground">Aktivní filtry:</span>
                    
                    {activeFilters.dateFilter && (
                        <Badge variant="outline" className="flex gap-1 items-center px-3 py-1">
                            <span>Datum:</span>
                            {activeFilters.dateFilter.type === 'before' ? 'Před ' : 
                             activeFilters.dateFilter.type === 'after' ? 'Po ' : 'Mezi '}
                            {activeFilters.dateFilter.startDate?.toLocaleDateString('cs-CZ')}
                            {activeFilters.dateFilter.type === 'between' && activeFilters.dateFilter.endDate && 
                             ` - ${activeFilters.dateFilter.endDate.toLocaleDateString('cs-CZ')}`}
                        </Badge>
                    )}
                    
                    {activeFilters.numberFilter && (
                        <Badge variant="outline" className="flex gap-1 items-center px-3 py-1">
                            <span>Body:</span>
                            {activeFilters.numberFilter.min !== undefined && 
                             `min ${activeFilters.numberFilter.min}`}
                            {activeFilters.numberFilter.min !== undefined && 
                             activeFilters.numberFilter.max !== undefined && ' - '}
                            {activeFilters.numberFilter.max !== undefined && 
                             `max ${activeFilters.numberFilter.max}`}
                        </Badge>
                    )}
                    
                    {activeFilters.customFilterParams?.categories && 
                     activeFilters.customFilterParams.categories.length > 0 && (
                        <Badge variant="outline" className="flex gap-1 items-center px-3 py-1">
                            <span>Kategorie:</span>
                            {activeFilters.customFilterParams.categories.join(', ')}
                        </Badge>
                    )}
                    
                    <button
                        onClick={handleClearFilters}
                        className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                    >
                        Vymazat filtry
                    </button>
                </div>
            )}
        </div>
    );
}