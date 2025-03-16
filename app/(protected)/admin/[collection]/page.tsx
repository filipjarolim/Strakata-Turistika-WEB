import React from "react";
import Link from "next/link";
import { getRecords } from "@/actions/admin/getRecords";
import { getRecordsCount } from "@/actions/admin/getRecordsCount";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

type PageProps = {
    params: { collection: string };
    searchParams: { page?: string };
};
type RecordType = {
    id: string;
    [key: string]: unknown; // Adjust this type based on the actual structure of your records
};
const CollectionListPage = async ({ params, searchParams }: PageProps) => {
    const { collection } = params;
    const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
    const pageSize = 25;
    const skip = (page - 1) * pageSize;
    const records = await getRecords(collection, skip, pageSize);
    const totalCount = await getRecordsCount(collection);
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{collection} Records</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        {records[0] &&
                            Object.keys(records[0]).map((key) => (
                                <TableHead key={key}>{key}</TableHead>
                            ))}
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((record: RecordType) => (
                        <TableRow key={record.id}>
                            {Object.entries(record).map(([key, value]) => (
                                <TableCell key={key}>
                                    {typeof value === "object" && value !== null
                                        ? JSON.stringify(value)
                                        : value?.toString()}
                                </TableCell>
                            ))}
                            <TableCell>
                                <Link href={`/admin/${collection}/${record.id}`}>
                                    <Button variant="default">Edit</Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
                <Button variant="outline" disabled={page <= 1} asChild>
                    <Link href={`/admin/${collection}?page=${page - 1}`}>Previous</Link>
                </Button>
                <span>
          Page {page} of {totalPages}
        </span>
                <Button variant="outline" disabled={page >= totalPages} asChild>
                    <Link href={`/admin/${collection}?page=${page + 1}`}>Next</Link>
                </Button>
            </div>
        </div>
    );
};

export default CollectionListPage;
