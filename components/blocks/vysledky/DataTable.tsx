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

export type FilterConfig = {
    dateField?: string;  // Field name to use for date filtering, like 'visitDate' or 'createdAt'
    numberField?: string; // Field name for number range filtering
    customFilter?: (data: any, filters: Record<string, any>) => boolean; // Custom filter function
}

const ROWS_PER_PAGE = 10;

export type DataTableProps<TData extends object> = {
    data: TData[];
    columns: ColumnDef<TData>[];
    year?: number;
    primarySortColumn?: string;
    primarySortDesc?: boolean;
    transformToAggregatedView?: (data: TData[]) => TData[];
    filterConfig?: FilterConfig;
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
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
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
        if (activeFilters.customFilterParams?.categories?.length > 0) count++;
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
        () => (isAggregatedView && transformToAggregatedView 
            ? transformToAggregatedView(filteredData) 
            : filteredData),
        [isAggregatedView, filteredData, transformToAggregatedView]
    );

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
    const applyFilters = (filters: Record<string, any>) => {
        let result = [...data];

        // Apply date filter if configured
        if (filters.dateFilter && filterConfig?.dateField) {
            const { type, startDate, endDate } = filters.dateFilter;
            const dateField = filterConfig.dateField;

            result = result.filter((item: any) => {
                if (!item[dateField]) return false;
                const itemDate = new Date(item[dateField]);

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

            result = result.filter((item: any) => {
                const value = parseFloat(item[numberField]);
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
                filterConfig.customFilter!(item, filters.customFilterParams)
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

    const handleCustomFilterChange = (filterParams: any) => {
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
        columns: filteredColumns,
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
            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 bg-white rounded-md shadow-sm px-2">
                <div className="flex flex-row items-center gap-2 select-none">
                    {enableSearch && (
                        <SearchFilterInput
                            filterValue={globalFilter}
                            setFilterValue={setGlobalFilter}
                        />
                    )}

                    {showDateFilter && !isAggregatedView && (
                        <div className="flex items-center gap-2">
                            <FilterButton
                                onDateFilterChange={filterConfig?.dateField ? handleDateFilterChange : undefined}
                                onNumberFilterChange={filterConfig?.numberField ? handleNumberFilterChange : undefined}
                                onCustomFilterChange={filterConfig?.customFilter ? handleCustomFilterChange : undefined}
                                onClearDateFilters={handleClearFilters}
                                onClearAllFilters={handleClearFilters}
                                year={year}
                                dateFieldLabel={filterConfig?.dateField || "Date"}
                                numberFieldLabel={filterConfig?.numberField || "Value"}
                                customFilterOptions={customFilterOptions}
                            />
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 select-none">
                    {enableAggregatedView && transformToAggregatedView && (
                        <ToggleViewButton
                            isCumulativeView={isAggregatedView}
                            toggleView={handleToggleView}
                            aggregatedViewLabel={aggregatedViewLabel}
                            detailedViewLabel={detailedViewLabel}
                        />
                    )}
                    {enableDownload && (
                        <DownloadDataButton 
                            data={memoizedData} 
                            year={year} 
                            filename={filename}
                            mainSheetName={mainSheetName}
                            summarySheetName={summarySheetName}
                            generateSummarySheet={generateSummarySheet}
                            transformToSummary={transformToAggregatedView}
                            summaryColumnDefinitions={summaryColumnDefinitions}
                        />
                    )}
                    {enableColumnVisibility && (
                        <ColumnVisibilityMenu table={table} />
                    )}
                </div>
            </div>

            {/* Status Section - Show filtered count, active filters, etc. */}
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                    {isAggregatedView ? (
                        <span>Showing {table.getRowModel().rows.length} {aggregatedViewLabel} records</span>
                    ) : (
                        <>
                            <span>Showing {table.getRowModel().rows.length} of {data.length} records</span>
                            {activeFilterCount > 0 && (
                                <span className="ml-2">
                                    (filtered from {data.length} total records)
                                </span>
                            )}
                        </>
                    )}
                </div>
                {activeFilterCount > 0 && (
                    <button 
                        onClick={handleClearFilters}
                        className="text-blue-500 hover:text-blue-700 text-sm underline"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Table Section */}
            <div className="rounded-md border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table className="min-w-[640px]">
                        <TableHeader className="bg-gray-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-gray-100">
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="font-semibold">
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                            <p className="text-gray-500">Loading data...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : isTableEmpty ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                            <AlertCircle className="h-8 w-8 text-gray-400" />
                                            <p className="text-gray-500">{emptyStateMessage}</p>
                                            {activeFilterCount > 0 && (
                                                <button 
                                                    onClick={handleClearFilters}
                                                    className="text-blue-500 hover:text-blue-700 text-sm mt-2 underline"
                                                >
                                                    Clear filters and try again
                                                </button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow 
                                        key={row.id} 
                                        className={cn(
                                            "transition-colors hover:bg-gray-50/50",
                                            row.index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-3">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {!loading && !isTableEmpty && (
                <PaginationControls
                    currentPage={table.getState().pagination.pageIndex + 1}
                    totalPages={table.getPageCount()}
                    canGoToNextPage={table.getCanNextPage()}
                    canGoToPreviousPage={table.getCanPreviousPage()}
                    goToNextPage={table.nextPage}
                    goToPreviousPage={table.previousPage}
                />
            )}
        </div>
    );
}