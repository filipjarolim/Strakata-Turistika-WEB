"use client"

import React from 'react'
import {useCurrentUser} from "@/hooks/use-current-user";

const Page = () => {
    const user = useCurrentUser();

    return (
        <div>
            Welcome to your profile
            <div className="mt-4">
                <pre>
                    {JSON.stringify(user, null, 2)}
                </pre>
            </div>
        </div>
    )
}
export default Page
