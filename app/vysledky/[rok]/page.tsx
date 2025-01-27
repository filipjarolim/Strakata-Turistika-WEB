'use client'
import React, { useEffect, useState } from 'react'
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";

const Page = ({ params }: { params: Promise<{ rok: string }> }) => {
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
        <CommonPageTemplate contents={{complete: true}}>
            Vysledky {rok}
        </CommonPageTemplate>
    )
}

export default Page