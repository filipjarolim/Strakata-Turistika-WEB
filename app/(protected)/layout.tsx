import React from 'react'
import {Navbar} from "@/app/(protected)/_components/navbar";

const ProtectedLayout = ({children}: {children: React.ReactNode}) => {
    return (
        <div className={"size-full flex flex-col gap-y-10 items-center justify-center"}>
            <Navbar />
            {children}
        </div>
    )
}
export default ProtectedLayout
