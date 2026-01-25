import React from 'react'
import { RegisterForm } from "@/components/auth/register-form";
import { currentRole, currentUser } from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import basicInfo from "@/lib/settings/basicInfo";
import Image from "next/image";

const RegisterPage = async () => {
    const user = await currentUser()
    const role = await currentRole()
    return (
        <CommonPageTemplate currentUser={user} currentRole={role} className={"px-0 bg-gray-200"}>
            <div className={"flex md:grid md:grid-cols-2 my-2 sm:my-[2vh] mx-2 sm:mx-[1vw] rounded-3xl sm:rounded-[50px] w-[calc(100vw-16px)] sm:w-[98vw] min-h-[calc(100vh-120px)] sm:h-[96vh] bg-white overflow-hidden"}>
                <div className="hidden md:flex flex-row items-center justify-center w-full h-full">
                    <Image src={basicInfo.img.loginImage} alt={"logo"} className={"object-contain max-w-full max-h-full"} />
                </div>
                <div className={"flex flex-row items-center justify-center bg-white p-4 sm:p-6 md:p-8 w-full"}>
                    <RegisterForm />
                </div>
            </div>
        </CommonPageTemplate>
    )
}
export default RegisterPage
