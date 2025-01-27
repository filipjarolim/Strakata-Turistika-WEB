"use client"

import Image from 'next/image';

import BackgrounImage from "@/assets/img/strakataturistikabackground.png"
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";

const Home = () => {

    return (
        <CommonPageTemplate contents={{complete: true}}>
            <div className={"grid grid-cols-2 w-full"}>
                <div className={"p-8"}>
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
        </CommonPageTemplate>
    );
}

export default Home;