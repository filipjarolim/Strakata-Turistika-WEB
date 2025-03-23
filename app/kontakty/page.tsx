import React from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import { ContactClient } from './contact-client';

const Page = async () => {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} className="p-6">
            <ContactClient />
        </CommonPageTemplate>
    );
};

export default Page;
