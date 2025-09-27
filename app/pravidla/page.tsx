import React from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import { PravidlaClient } from './pravidla-client';

const Page = async () => {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} className="px-3 sm:px-4 md:px-6">
            <PravidlaClient />
        </CommonPageTemplate>
    );
};

export default Page;
