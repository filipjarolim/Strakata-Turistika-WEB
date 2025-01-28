"use client"

import Image from 'next/image';

import BackgrounImage from "@/assets/img/strakataturistikabackground.png"
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { Button } from '@/components/ui/button';
import InstallButton from "@/components/pwa/InstallButton";

const Home = () => {

    return (
        <CommonPageTemplate contents={{complete: true}}>
            <div className={"grid grid-cols-1 md:grid-cols-2 w-full"}>
                <div className={"p-8 hidden md:block z-10 w-full"}>
                    <h1 className="text-6xl font-bold mb-4 ">
                        Strakatá turistika
                    </h1>
                </div>
                <div>
                    <Image src={
                        BackgrounImage
                    } alt="Strakatá turistika" width={600} height={600}/>
                </div>
            </div>
            <div className={"flex gap-x-2 flex-row items-center justify-start p-4 w-full"}>
                <Button variant={"outline"} className={"rounded-full"}>
                    Prozkoumat
                </Button>
                <InstallButton />
            </div>
        </CommonPageTemplate>
    );
}

export default Home;