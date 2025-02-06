'use client';

import React, {useCallback, useMemo, useState } from 'react';
import {
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { columns } from './columns';
import { SearchFilterInput } from './SearchFilterInput';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { PaginationControls } from './PaginationControls';
import { DownloadDataButton } from './DownloadDataButton';
import { ToggleViewButton } from './ToggleViewButton'; // Import new component
import { FilterButton } from './FilterButton'; // Import FilterButton

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

const ROWS_PER_PAGE = 10;
const PRIMARY_SORT_COLUMN = 'points';
const PRIMARY_SORT_DESC = true;

export const DataTable = ({ data, year }: { data: VisitData[]; year: number }) => {
    const [sorting, setSorting] = useState<SortingState>([
        { id: PRIMARY_SORT_COLUMN, desc: PRIMARY_SORT_DESC },
    ]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [isCumulativeView, setIsCumulativeView] = useState(false);
    const [filteredData, setFilteredData] = useState<VisitData[]>(data);

    // Dynamically filter columns based on cumulative view
    const filteredColumns = useMemo(() => {
        if (isCumulativeView) {
            return columns.filter(
                (col) =>
                    'accessorKey' in col &&
                    col.accessorKey &&
                    !['visitDate', 'dogNotAllowed', 'routeLink'].includes(col.accessorKey)
            );
        }

        return columns; // Show all columns in individual view
    }, [isCumulativeView]);

    // Memoize the transformed data: cumulative or detailed
    const transformToCumulativeData = useCallback(() => {
        const cumulativeDataMap = new Map<string, VisitData>();

        data.forEach((entry) => {
            const existingRecord = cumulativeDataMap.get(entry.fullName);

            if (existingRecord) {
                existingRecord.points += entry.points;
                existingRecord.visitedPlaces += `, ${entry.visitedPlaces}`;
            } else {
                cumulativeDataMap.set(entry.fullName, { ...entry });
            }
        });

        return Array.from(cumulativeDataMap.values());
    }, [data]);

    const memoizedData = useMemo(
        () => (isCumulativeView ? transformToCumulativeData(filteredData) : filteredData),
        [isCumulativeView, filteredData, transformToCumulativeData]
    );

    // Date filter logic
    const handleDateFilterChange = (
        filterType: 'before' | 'after' | 'between',
        dates: [Date | undefined, Date | undefined]
    ) => {
        const [startDate, endDate] = dates;

        const filtered = data.filter((log) => {
            if (!log.visitDate) return false; // Skip if no date available
            const visitDate = new Date(log.visitDate);

            if (filterType === 'before') {
                return startDate && visitDate < startDate;
            }
            if (filterType === 'after') {
                return startDate && visitDate > startDate;
            }
            if (filterType === 'between') {
                return startDate && endDate && visitDate >= startDate && visitDate <= endDate;
            }
            return false;
        });

        setFilteredData(filtered);
    };

    const handleSortingChange = useCallback((newSorting: React.SetStateAction<SortingState>) => setSorting(newSorting), []);
    const handleColumnVisibilityChange = useCallback(
        (newVisibility: React.SetStateAction<VisibilityState>) => setColumnVisibility(newVisibility),
        []
    );
    const handleGlobalFilterChange = useCallback((newFilterValue: React.SetStateAction<string>) => setGlobalFilter(newFilterValue), []);

    // React Table instance
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

    return (
        <div className="w-full">
            <div className="w-full flex items-center justify-between py-4">
                <SearchFilterInput
                    filterValue={globalFilter}
                    setFilterValue={setGlobalFilter}
                />
                <div className="flex items-center gap-2">
                    <ToggleViewButton
                        isCumulativeView={isCumulativeView}
                        toggleView={() => setIsCumulativeView(!isCumulativeView)}
                    />
                    <FilterButton onDateFilterChange={handleDateFilterChange} />
                    <DownloadDataButton data={memoizedData} year={year} />
                    <ColumnVisibilityMenu table={table} />
                </div>
            </div>

            <div className="rounded-md border w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {typeof header.column.columnDef.header === 'function'
                                            ? header.column.columnDef.header(header.getContext())
                                            : header.column.columnDef.header || null}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {typeof cell.column.columnDef.cell === 'function'
                                            ? cell.column.columnDef.cell(cell.getContext())
                                            : cell.getValue()} {/* Fallback for simpler columns */}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls
                currentPage={table.getState().pagination.pageIndex + 1}
                totalPages={table.getPageCount()}
                canGoToNextPage={table.getCanNextPage()}
                canGoToPreviousPage={table.getCanPreviousPage()}
                goToNextPage={table.nextPage}
                goToPreviousPage={table.previousPage}
            />
        </div>
    );
};
