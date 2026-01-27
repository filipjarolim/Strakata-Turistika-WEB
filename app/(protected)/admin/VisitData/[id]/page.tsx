import React from "react";
import { getRecordById } from "@/actions/admin/getRecordById";
import DynamicForm from "@/components/admin/DynamicForm";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentUser, currentRole } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { VisitValidationClient } from "./visit-validation-client";

interface Params {
    id: string;
}

interface PageProps {
    params: Promise<Params>;
}

const VisitDetailAdminPage = async ({ params }: PageProps) => {
    // Resolve params properly (Next 15 async params)
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const collection = "VisitData"; // Hardcoded for this route override

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
                            Záznam návštěvy nebyl nalezen.
                        </AlertDescription>
                    </Alert>
                </div>
            </CommonPageTemplate>
        );
    }

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
            <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">

                {/* Custom Validation Section */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <VisitValidationClient visit={record as any} />

                {/* Standard Dynamic Form */}
                <DynamicForm initialData={record} collection={collection} recordId={id} />
            </div>
        </CommonPageTemplate>
    );
};

export default VisitDetailAdminPage;
