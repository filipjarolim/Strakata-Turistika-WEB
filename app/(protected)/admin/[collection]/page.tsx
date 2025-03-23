"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/blocks/vysledky/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Pencil } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

type RecordType = {
    id: string;
    [key: string]: unknown;
};

// Define types for the table column parameters
type ColumnParams = {
    column: {
        toggleSorting: (state: boolean) => void;
        getIsSorted: () => string | false;
    };
};

type RowParams = {
    row: {
        getValue: (key: string) => unknown;
    };
};

const CollectionPage = () => {
    const params = useParams();
    const router = useRouter();
    const collection = params.collection as string;
    
    const [records, setRecords] = useState<RecordType[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/admin/${collection}`);
                if (!response.ok) throw new Error('Failed to fetch records');
                const data = await response.json();
                setRecords(data);
            } catch (error) {
                console.error('Error fetching records:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (collection) {
            fetchRecords();
        }
    }, [collection]);
    
    // Create dynamic columns based on records
    const columns: ColumnDef<RecordType>[] = React.useMemo(() => {
        if (!records || records.length === 0) return [];

        // Get keys from the first record to determine columns
        const columnDefinitions = Object.keys(records[0]).map((key) => {
            // Special case for ID column
            if (key === "id") {
                return {
                    accessorKey: key,
                    header: ({ column }: ColumnParams) => (
                        <div className="flex items-center space-x-1">
                            <span>ID</span>
                            <button
                                className="p-0 m-0 h-auto w-auto"
                                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </button>
                        </div>
                    ),
                    cell: ({ row }: RowParams) => <span className="font-mono text-xs">{String(row.getValue(key))}</span>,
                } as ColumnDef<RecordType>;
            }

            // For standard columns
            return {
                accessorKey: key,
                header: ({ column }: ColumnParams) => (
                    <div className="flex items-center space-x-1">
                        <span>{key}</span>
                        <button
                            className="p-0 m-0 h-auto w-auto"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            <ArrowUpDown className="h-4 w-4" />
                        </button>
                    </div>
                ),
                cell: ({ row }: RowParams) => {
                    const value = row.getValue(key);
                    
                    // Handle different value types
                    if (value === null) return <span className="text-gray-400">null</span>;
                    if (typeof value === "object") return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
                    if (typeof value === "boolean") return value ? "Yes" : "No";
                    
                    return <span>{String(value)}</span>;
                },
            } as ColumnDef<RecordType>;
        });

        // Add actions column
        const actionsColumn: ColumnDef<RecordType> = {
            id: "actions",
            header: "Actions",
            cell: ({ row }: RowParams) => {
                return (
                    <Link href={`/admin/${collection}/${String(row.getValue("id"))}`}>
                        <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                );
            },
        };

        return [...columnDefinitions, actionsColumn];
    }, [collection, records]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{collection} Records</h1>
                <Link href="/admin">
                    <Button variant="outline">Back to Admin</Button>
                </Link>
            </div>
            
            <DataTable
                data={records}
                columns={columns}
                enableSearch={true}
                enableColumnVisibility={true}
                emptyStateMessage={`No ${collection} records found`}
                primarySortColumn="id"
                loading={loading}
            />
        </div>
    );
};

export default CollectionPage;
