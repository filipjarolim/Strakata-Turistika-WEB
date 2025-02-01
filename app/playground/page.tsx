import React from 'react'

import Header from "@/components/structure/Header";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import {currentRole, currentUser} from "@/lib/auth";

import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import InstallPrompt from "@/components/pwa/InstallPrompt";

const Page = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            Playground
            <PushNotificationManager />
            <InstallPrompt />
        </CommonPageTemplate>

    )
}
export default Page
