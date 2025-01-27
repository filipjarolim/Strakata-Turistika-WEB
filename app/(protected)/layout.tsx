import React from 'react'
import Header from "@/components/structure/Header";

const ProtectedLayout = ({children}: {children: React.ReactNode}) => {
    return (
        <div>
            {children}
        </div>
    )
}
export default ProtectedLayout
