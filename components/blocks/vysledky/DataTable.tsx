'use client';

import React, { useState } from 'react';
import {
    ColumnDef,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type VisitedPlacesCellProps = {
    visitedPlaces: string;
};

export const VisitedPlacesCell: React.FC<VisitedPlacesCellProps> = ({ visitedPlaces }) => {
    const placesArray = visitedPlaces
        ?.split(',')
        .map((place) => place.trim())
        .filter((place) => place !== ''); // Exclude empty strings

    const [showAll, setShowAll] = useState(false);
    const visiblePlaces = showAll ? placesArray : placesArray.slice(0, 5);

    return (
        <div className="flex flex-col space-y-1">
            <div className="flex flex-wrap gap-2">
                {/* Render visible places as badges */}
                {visiblePlaces.map((place, index) => (
                    <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                            const searchQuery = encodeURIComponent(place);
                            window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                        }}
                    >
                        {place}
                    </Badge>
                ))}

                {/* Add the "Show more" or "Show less" badge at the end */}
                {placesArray.length > 5 && (
                    <Badge
                        variant={showAll ? 'default' : 'secondary'} // Use a different style for "Show less"
                        className="cursor-pointer"
                        onClick={() => setShowAll(!showAll)} // Toggle showAll on click
                    >
                        {showAll
                            ? 'Zobrazit méně' // Display "Show less" text when showing all places
                            : `Zobrazit dalších ${placesArray.length - 5} míst`}
                    </Badge>
                )}
            </div>
        </div>
    );
};

type VisitData = {
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

const createColumns = (): ColumnDef<VisitData>[] => [
    {
        accessorKey: 'visitDate',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Datum Návštěvy</span>
                <Button
                    variant="ghost"
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="h-4 w-4" />
                    )}
                </Button>
            </div>
        ),
        cell: ({ row }) => {
            const date = row.getValue('visitDate') as string | null;
            return date ? new Date(date).toLocaleDateString() : 'N/A';
        },
    },
    {
        accessorKey: 'fullName',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Jméno</span>
                <Button
                    variant="ghost"
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="h-4 w-4" />
                    )}
                </Button>
            </div>
        ),
    },
    {
        accessorKey: 'dogName',
        header: ({ column }) => (
            <div className="flex items-center space-x-1">
                <span>Jméno Psa</span>
                <Button
                    variant="ghost"
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="h-4 w-4" />
                    )}
                </Button>
            </div>
        ),
        cell: ({ row }) => row.getValue('dogName') || 'N/A',
    },
    {
        accessorKey: 'points',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                <span>Body</span>
                <Button
                    variant="ghost"
                    className="p-0 m-0 h-auto w-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    {column.getIsSorted() === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : column.getIsSorted() === 'desc' ? (
                        <ArrowDown className="h-4 w-4" />
                    ) : (
                        <ArrowUpDown className="h-4 w-4" />
                    )}
                </Button>
            </div>
        ),
        cell: ({ row }) => (
            <div className="text-right font-medium">{row.getValue('points')}</div>
        ),
    },
    {
        accessorKey: 'visitedPlaces',
        header: 'Navštívená Místa',
        cell: ({ row }) => {
            const visitedPlaces = row.getValue('visitedPlaces') as string;
            return <VisitedPlacesCell visitedPlaces={visitedPlaces} />;
        },
    },
];

export const DataTable = ({ data }: { data: VisitData[] }) => {
    const columns = createColumns();
    const [sorting, setSorting] = useState<SortingState>([
        { id: PRIMARY_SORT_COLUMN, desc: PRIMARY_SORT_DESC },
    ]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnVisibility,
        },
        initialState: {
            pagination: {
                pageSize: ROWS_PER_PAGE,
            },
        },
    });

    return (
        <div className="w-full">
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filtr Jméno..."
                    value={(table.getColumn('fullName')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('fullName')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Sloupce <ChevronDown />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                const columnName =
                                    typeof column.columnDef.header === 'string'
                                        ? column.columnDef.header
                                        : column.id;

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {columnName}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
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
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Stránka {table.getState().pagination.pageIndex + 1} z{' '}
                    {table.getPageCount()}
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Předchozí
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Další
                    </Button>
                </div>
            </div>
        </div>
    );
};