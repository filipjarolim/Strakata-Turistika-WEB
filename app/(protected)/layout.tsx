import React from 'react'
import Header from "@/components/structure/Header";

const ProtectedLayout = ({children}: {children: React.ReactNode}) => {
    return (
        <div className={"size-full flex flex-col gap-y-10 items-center justify-center"}>
            <Header />
            {children}
        </div>
    )
}
export default ProtectedLayout
