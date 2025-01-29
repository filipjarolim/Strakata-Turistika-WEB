import Image from 'next/image';

import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Button } from '@/components/ui/button';
import InstallButton from "@/components/pwa/InstallButton";
import basicInfo from "@/lib/settings/basicInfo";
import {Separator} from "@/components/ui/separator";
import React from "react";
import {Card} from "@/components/ui/card";
import {useCurrentUser} from "@/hooks/use-current-user";
import {useCurrentRole} from "@/hooks/use-current-role";
import { currentUser } from "@/lib/auth";
import { currentRole } from "@/lib/auth";


const Home = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            <div className={"grid grid-cols-1 md:grid-cols-2 w-full"}>
                <div className={"p-8 py-12 hidden md:flex z-10 w-full flex-col items-start justify-center h-full"}>
                    <h1 className="text-7xl font-bold mb-4 ">
                        {basicInfo.name}
                    </h1>
                    <p className="text-6xl  font-semibold mb-4 text-gray-700/60 ">
                        aneb poznáváme
                        {" "}
                        <span className={"inline-block bg-red-300 text-red-950/70 rounded-full text-5xl w-fit px-4 pb-1 pt-3"}>
                            <span className={"flex flex-row items-center justify-start"}>
                                <span className={"text-4xl"}>
                                📌
                            </span>
                            Česko
                            </span>
                        </span>
                        {" "}
                        s českým strakatým psem
                        {" "}
                        <Image src={basicInfo.img.icons.small} alt="Logo" width={64} height={64} className="rounded-full inline-block"/>

                    </p>
                    <div className={"flex gap-x-2 flex-row items-center justify-start py-4 w-full"}>
                    <Button variant={"outline"} className={"rounded-full"}>
                            Prozkoumat
                        </Button>
                        <InstallButton/>
                    </div>
                </div>
                <div className={"flex flex-row items-center justify-center"}>
                    <Image src={basicInfo.img.coverImage} alt="Strakatá turistika" className={"w-[90%]"}/>
                </div>
            </div>
            <Separator />
            <div className={"p-8"}>
                <h2 className="text-4xl font-bold mb-6 ">
                    Aktuality
                </h2>
                <div className={"flex flex-wrap items-center justify-start gap-8 w-full"}>
                    <Card className={"w-[400px] h-[260px] p-6 rounded-[25px]"}>
                        <h3 className="text-2xl font-bold mb-4 text-gray-700/90">
                            Nový vzhled webu
                        </h3>
                    </Card> <Card className={"w-[400px] h-[260px] p-6 rounded-[25px]"}>
                        <h3 className="text-2xl font-bold mb-4 text-gray-700/90">
                            Nový vzhled webu
                        </h3>
                    </Card> <Card className={"w-[400px] h-[260px] p-6 rounded-[25px]"}>
                        <h3 className="text-2xl font-bold mb-4 text-gray-700/90">
                            Nový vzhled webu
                        </h3>
                    </Card>
                </div>
            </div>
        </CommonPageTemplate>
    );
}

export default Home;