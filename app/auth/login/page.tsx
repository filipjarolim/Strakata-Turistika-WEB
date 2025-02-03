import React from 'react'
import {LoginForm} from "@/components/auth/login-form";
import {currentRole, currentUser} from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";

const LoginPage = async () => {
    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate currentUser={user} currentRole={role} className={"md:px-0"}>
            <div className={"flex md:grid md:grid-cols-2 w-full h-screen"}>
                <div className={"hidden md:flex flex-col items-center justify-center bg-gray-200"}>

                </div>
                <div className={"flex flex-row items-center justify-center"}>
                    <LoginForm />
                </div>
            </div>
        </CommonPageTemplate>

    )
}
export default LoginPage
