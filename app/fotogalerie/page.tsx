import React from 'react';
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { currentRole, currentUser } from "@/lib/auth";
import { GalleryClient } from './gallery-client';

const Page = async () => {
    const user = await currentUser();
    const role = await currentRole();

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} className="px-6">
            <GalleryClient />
        </CommonPageTemplate>
    );
};

export default Page;
