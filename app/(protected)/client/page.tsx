"use client";

import { UserInfo } from "@/components/auth/user-info";
import { useCurrentUser } from "@/hooks/use-current-user";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import React from "react";

const ClientPage = () => {
    const user = useCurrentUser();

    return (
        <CommonPageTemplate contents={{complete: true}}>
            <UserInfo
                label="📱 Client component"
                user={user}
            />
        </CommonPageTemplate>

    );
}

export default ClientPage;