import React from 'react'

import Header from "@/components/structure/Header";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import {currentRole, currentUser} from "@/lib/auth";

import PushNotificationManager from "@/components/pwa/PushNotificationManager";
import InstallButton from "@/components/pwa/InstallButton";
import Timer from "@/components/pwa/Timer";
import GPSTracker from "@/components/pwa/GPSTracker";

const Page = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{header: true}} currentUser={user} currentRole={role}>
            Playground

            <GPSTracker />

        </CommonPageTemplate>

    )
}
export default Page
