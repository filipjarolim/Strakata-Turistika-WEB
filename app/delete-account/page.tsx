import React from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import { DeleteAccountClient } from './delete-account-client';

const Page = async () => {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} className="px-6">
            <DeleteAccountClient />
        </CommonPageTemplate>
    );
};

export default Page; 