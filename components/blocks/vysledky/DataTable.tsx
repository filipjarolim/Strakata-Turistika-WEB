'use client';

import React, { useState } from 'react';
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

const ROWS_PER_PAGE = 5;
const PRIMARY_SORT_COLUMN = 'points';
const PRIMARY_SORT_DESC = true;

export const DataTable = ({ data }: { data: VisitData[] }) => {
    /** State Definitions */
    const [sorting, setSorting] = useState<SortingState>([
        { id: PRIMARY_SORT_COLUMN, desc: PRIMARY_SORT_DESC },
    ]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState<string>(''); // State for the search filter

    /** Table Configuration */
    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter, // Apply the global filter update
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(), // Enable filtered row model
        initialState: {
            pagination: {
                pageSize: ROWS_PER_PAGE,
            },
        },
    });

    /** Render */
    return (
        <div className="w-full">
            {/* Search and Column Menu */}
            <div className="flex items-center py-4">
                <SearchFilterInput
                    filterValue={globalFilter}
                    setFilterValue={setGlobalFilter}
                />
                <ColumnVisibilityMenu table={table} />
            </div>

            {/* Main Table */}
            <div className="rounded-md border w-full">
                <Table className={"w-full"}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {/* Safely handle both string and function for the header */}
                                        {typeof header.column.columnDef.header === 'function'
                                            ? header.column.columnDef.header(header.getContext())
                                            : header.column.columnDef.header || null}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {typeof cell.column.columnDef.cell === 'function'
                                                ? cell.column.columnDef.cell(cell.getContext())
                                                : cell.column.columnDef.cell ||
                                                null /* Render fallback content if `cell` is a string or undefined */}
                                        </TableCell>
                                    ))}
                                </TableRow>


                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Žádné výsledky.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <PaginationControls
                currentPage={table.getState().pagination.pageIndex + 1}
                totalPages={table.getPageCount()}
                goToPreviousPage={table.previousPage}
                goToNextPage={table.nextPage}
                canGoToPreviousPage={table.getCanPreviousPage()}
                canGoToNextPage={table.getCanNextPage()}
            />
        </div>
    );
};