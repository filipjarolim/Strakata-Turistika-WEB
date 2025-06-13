import React from 'react'
import {NewVerificationForm} from "@/components/auth/new-verification-form";
import {currentRole, currentUser} from "@/lib/auth";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import basicInfo from "@/lib/settings/basicInfo";
import Image from "next/image";

const NewVerificationPage = async () => {
    const user = await currentUser()
    const role = await currentRole()
    return (
        <CommonPageTemplate currentUser={user} currentRole={role} className={"md:px-0 bg-gray-200"}>
            <div className={"flex md:grid md:grid-cols-2 my-[2vh] mx-[1vw] rounded-[50px]  w-[98vw] h-[96vh] bg-white overflow-hidden"}>
                <div className="flex flex-row items-center justify-center w-full h-full">
                    <Image src={basicInfo.img.loginImage} alt={"logo"} className={"hidden md:flex"} />
                </div>
                <div className={"flex flex-row items-center justify-center bg-white"}>
                    <NewVerificationForm />
                </div>
            </div>
        </CommonPageTemplate>
    )
}
export default NewVerificationPage
