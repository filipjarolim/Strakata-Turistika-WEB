'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
    useReactTable,
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input'; // Assume inputs follow shadcn/ui style
import { Button } from '@/components/ui/button';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate"; // Assume buttons follow shadcn/ui style
import {useCurrentUser } from '@/hooks/use-current-user';
import {useCurrentRole } from '@/hooks/use-current-role';

// Define the data type
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

const DataTable = ({ data }: { data: VisitData[] }) => {
    const [globalFilter, setGlobalFilter] = useState<string>('');
    const [sorting, setSorting] = useState<SortingState>([]); // Correctly typed sorting state

    // Define table columns
    const columns: ColumnDef<VisitData>[] = useMemo(
        () => [
            {
                accessorKey: 'visitDate',
                header: 'Datum Návštěvy',
                cell: (info) => {
                    const date = info.getValue() as string | null;
                    return date ? new Date(date).toLocaleDateString() : 'N/A';
                },
            },
            {
                accessorKey: 'fullName',
                header: 'Jméno',
            },
            {
                accessorKey: 'dogName',
                header: 'Jméno Psa',
                cell: (info) => info.getValue() || 'N/A',
            },
            {
                accessorKey: 'points',
                header: 'Body',
            },
            {
                accessorKey: 'visitedPlaces',
                header: 'Navštívená Místa',
            },
            {
                accessorKey: 'dogNotAllowed',
                header: 'Pes Zakázán',
                cell: (info) => info.getValue() || 'N/A',
            },
            {
                accessorKey: 'routeLink',
                header: 'Odkaz na Trasu',
                cell: (info) => {
                    const link = info.getValue() as string | null;
                    return link ? (
                        <a href={link} target="_blank" rel="noopener noreferrer">
                            Odkaz
                        </a>
                    ) : (
                        'N/A'
                    );
                },
            },
        ],
        []
    );

    // Create the table instance
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            globalFilter,
            sorting,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
    });

    return (
        <div>
            {/* Global Filter */}
            <div className="mb-4 flex items-center gap-2">
                <Input
                    placeholder="Search all columns..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <Button onClick={() => setGlobalFilter('')}>Clear</Button>
            </div>

            {/* Table */}
            <Table>
                <TableCaption>Seznam návštěv</TableCaption>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : (
                                        <div
                                            className={`cursor-pointer select-none ${
                                                header.column.getCanSort() ? 'text-blue-500' : ''
                                            }`}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === 'asc' ? ' 🔼' : null}
                                            {header.column.getIsSorted() === 'desc' ? ' 🔽' : null}
                                        </div>
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
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
                            <TableCell colSpan={columns.length} className="text-center">
                                No results found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

const Page = ({ params }: { params: Promise<{ rok: string }> }) => {
    const [visitData, setVisitData] = useState<VisitData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const user = useCurrentUser()
    const role = useCurrentRole()

    useEffect(() => {
        async function fetchResults() {
            const { rok } = await params;
            const res = await fetch(`/api/results/${rok}`);
            const data: VisitData[] = await res.json();
            setVisitData(data);
            setLoading(false);
        }

        fetchResults();
    }, [params]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            <h1>Výsledky</h1>
            <DataTable data={visitData} />
        </CommonPageTemplate>
    );
};

export default Page;