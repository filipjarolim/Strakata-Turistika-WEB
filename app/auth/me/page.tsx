import CommonPageTemplate from '@/components/structure/CommonPageTemplate'
import React from 'react'
import {useCurrentUser} from "@/hooks/use-current-user";
import {useCurrentRole} from "@/hooks/use-current-role";

const Page = () => {
    const user = useCurrentUser();
    const role = useCurrentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            Me
            {JSON.stringify(user, null, 2)}

        </CommonPageTemplate>
    )
}
export default Page
