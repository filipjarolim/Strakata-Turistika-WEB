'use client'
import React from 'react'

import { useRouter } from 'next/router'

const Page = () => {

    const router = useRouter()
    return <p>Post: {router.query.rok}</p>

}
export default Page
