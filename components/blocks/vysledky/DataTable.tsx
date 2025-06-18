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
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export interface VisitData {
    id: string;
    visitDate: string | null;
    points: number;
    visitedPlaces: string;
    dogNotAllowed: string;
    routeLink: string | null;
    year: number;
    extraPoints: {
        description: string;
        distance: number;
        totalAscent: number;
        elapsedTime: number;
        averageSpeed: number;
    };
    state: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    routeTitle: string;
    routeDescription: string | null;
    rejectionReason?: string | null;
    createdAt?: string | null;
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
            <div className="flex flex-col gap-4 p-4 bg-muted/5 rounded-lg border">
                {/* Search and Filters row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* View controls */}
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
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
                            />
                        )}
                    </div>
                </div>

                {/* Active filters display */}
                {(activeFilters.dateFilter || activeFilters.numberFilter || activeFilters.customFilterParams?.categories?.length) && (
                    <div className="flex flex-wrap gap-2 items-center pt-2 border-t">
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
                )}
            </div>

            {/* Table Container */}
            {!loading && (
                <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
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
                                    table.getRowModel().rows.map((row, index) => (
                                        <TableRow 
                                            key={row.id}
                                            className={cn(
                                                "transition-colors hover:bg-muted/30",
                                                index % 2 === 0 ? "bg-background" : "bg-muted/5"
                                            )}
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
            )}

            {/* Pagination */}
            {table.getRowModel().rows?.length > 0 && (
                <div className="mt-4">
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
        </div>
    );
}