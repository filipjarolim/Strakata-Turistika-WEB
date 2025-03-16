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
import DogEmoji from "@/assets/img/dog_emoji.png";
import PinEmoji from "@/assets/img/pin_emoji.png";
import News from "@/components/blocks/News";


const Home = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            <div className={"grid grid-cols-1 md:grid-cols-2 w-full"}>
                <div className={"p-8   hidden md:flex z-10 w-full flex-col items-start justify-center h-full cursor-default"}>
                    <h1 className="text-7xl font-bold mb-4 ">
                        {basicInfo.name}
                    </h1>
                    <p className="text-6xl  font-semibold mb-4 text-gray-700/60">
                        aneb poznáváme
                        {" "}
                        <span className={"inline-block bg-red-300 text-red-950/70 rounded-full text-5xl w-fit px-4 pb-1 pt-3"}>
                            <span className={"flex flex-row items-center justify-start"}>
                                <span className={"text-4xl"}>
                                    <Image src={PinEmoji} alt="emoji" width={48} height={48} className="rounded-full inline-block"/>

                            </span>
                            Česko
                            </span>
                        </span>
                        {" "}
                        s českým strakatým
                        {" "}
                        <span
                            className={"inline-block bg-amber-300 text-amber-950/70 bg rounded-full text-5xl w-fit px-4"}>
                            <span className={"flex flex-row items-center justify-start"}>
                                <span className={"text-4xl"}>
                                    <Image src={DogEmoji} alt="emoji" width={64} height={64}
                                           className="rounded-full inline-block"/>

                                </span>
                             psem
                            </span>
                        </span>
                        .


                    </p>
                    <div className={"flex gap-x-2 flex-row items-center justify-start py-4 w-full"}>
                        <Button variant={"outline"} className={"rounded-full"}>
                            Prozkoumat
                        </Button>
                        <InstallButton/>
                    </div>
                </div>
                <div className={"flex flex-row items-center justify-center select-none"}>
                    <Image src={basicInfo.img.coverImage} alt="Strakatá turistika" className={"w-[100%]"}/>
                </div>
                <p className="text-5xl md:hidden text-center  font-semibold mt-4 text-gray-700/60">
                    aneb poznáváme
                    {" "}
                    <span className={"text-black/70 font-bold"}>
                        Česko
                    </span>
                    {" "}
                    s českým
                    {" "}
                    <span className={"text-black/70 font-bold"}>
                         strakatým psem
                    </span>
                    .


                </p>
                <div className={"flex md:hidden flex-row items-center justify-center py-4 w-full"}>
                    <Button variant={"outline"} className={"rounded-full"}>
                        Prozkoumat
                    </Button>
                    <InstallButton/>
                </div>
            </div>
            <Separator/>
            <News/>
        </CommonPageTemplate>
    );
}

export default Home;