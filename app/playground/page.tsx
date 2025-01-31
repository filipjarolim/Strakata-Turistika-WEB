import React from 'react'

import Header from "@/components/structure/Header";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import {currentRole, currentUser} from "@/lib/auth";
import NotificationButton from "@/components/blocks/NotificationButton";

const Page = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            Playground
            <NotificationButton />
        </CommonPageTemplate>

    )
}
export default Page
