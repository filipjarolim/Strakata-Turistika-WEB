import React from 'react'

import Header from "@/components/structure/Header";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import {currentRole, currentUser} from "@/lib/auth";

import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import InstallButton from "@/components/pwa/InstallButton";
import Timer from "@/components/pwa/Timer";

const Page = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            Playground
            <PushNotificationManager />
            <InstallButton />
            <Timer />

        </CommonPageTemplate>

    )
}
export default Page
