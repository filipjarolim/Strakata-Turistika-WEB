import React from 'react'

import Header from "@/components/structure/Header";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import {currentRole, currentUser} from "@/lib/auth";

const Page = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            Playground
        </CommonPageTemplate>

    )
}
export default Page
