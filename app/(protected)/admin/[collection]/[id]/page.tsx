import React from "react";
import { getRecordById } from "@/actions/admin/getRecordById";
import DynamicForm from "@/components/admin/DynamicForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentUser, currentRole } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Define the Params type that will be resolved asynchronously.
interface Params {
    collection: string;
    id: string;
}

interface PageProps {
    params: Promise<Params>;
}

const EditRecordPage = async ({ params }: PageProps) => {
    // Await the params promise to extract collection and id.
    const { collection, id } = await params;
    const user = await currentUser();
    const role = await currentRole();

    // Fetch the record
    const record = await getRecordById(collection, id);

    if (!record) {
        return (
            <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
                <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Záznam nebyl nalezen. Možná byl smazán nebo ID je neplatné.
                        </AlertDescription>
                    </Alert>
                </div>
            </CommonPageTemplate>
        );
    }

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
            <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
                <DynamicForm initialData={record} collection={collection} recordId={id} />
            </div>
        </CommonPageTemplate>
    );
};

export default EditRecordPage;
