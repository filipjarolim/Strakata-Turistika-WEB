'use client'
import React, { useEffect, useState } from 'react'
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import {useCurrentUser} from "@/hooks/use-current-user";
import {useCurrentRole} from "@/hooks/use-current-role";


const Page = ({ params }: { params: Promise<{ rok: string }> }) => {

    const user = useCurrentUser()
    const role = useCurrentRole()

    const [rok, setRok] = useState<string | null>(null)

    useEffect(() => {
        params.then(data => {
            setRok(data.rok)
        })
    }, [params])

    if (rok === null) {
        return <p>Loading...</p>
    }

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            Vysledky {rok}
        </CommonPageTemplate>
    )
}

export default Page