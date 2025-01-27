import { currentUser } from "@/lib/auth";
import { UserInfo } from "@/components/auth/user-info";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import React from "react";

const ServerPage = async () => {
    const user = await currentUser();

    return (
        <CommonPageTemplate contents={{complete: true}}>
            <UserInfo
                label="💻 Server component"
                user={user}
            />
        </CommonPageTemplate>

    );
}

export default ServerPage;