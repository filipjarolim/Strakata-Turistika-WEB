import React from "react";
import Link from "next/link";
import { getRecordById } from "@/actions/admin/getRecordById";
import DynamicForm from "@/components/admin/DynamicForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Correctly defining PageProps
interface PageProps {
    params: { collection: string; id: string };
}

// Ensure async function is used properly
const EditRecordPage = async ({ params }: PageProps) => {
    const { collection, id } = params;

    // Fetch the record
    const record = await getRecordById(collection, id);

    if (!record) {
        return <div>Record not found</div>;
    }

    return (
        <div className="p-6">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <h1 className="text-2xl font-bold">Edit {collection} Record</h1>
                    <Link href={`/admin/${collection}`}>
                        <Button variant="outline" className="mt-2">
                            Back to List
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <DynamicForm initialData={record} collection={collection} recordId={id} />
                </CardContent>
            </Card>
        </div>
    );
};

export default EditRecordPage;

// Tell Next.js this is a dynamic route (prevents type errors in params)
export async function generateStaticParams() {
    return []; // Empty array allows Next.js to treat this as a dynamic route
}
