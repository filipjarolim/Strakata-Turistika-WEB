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
import { MapPin, Calendar, Award, ArrowRight } from "lucide-react";

const featuredLocations = [
    {
        id: 1,
        title: "Krkonošský národní park",
        description: "Objevte krásy nejvyššího českého pohoří s vaším čtyřnohým přítelem.",
        image: "/locations/krkonose.jpg"
    },
    {
        id: 2,
        title: "Český ráj",
        description: "Prozkoumejte úchvatné skalní město a malebné stezky.",
        image: "/locations/cesky-raj.jpg"
    },
    {
        id: 3,
        title: "Šumava",
        description: "Nechte se okouzlit nádhernou přírodou a křišťálovými jezery.",
        image: "/locations/sumava.jpg"
    }
];

const benefits = [
    {
        title: "Objevujte nová místa",
        description: "Prozkoumejte neznámá místa s vaším psím parťákem.",
        icon: <MapPin className="w-10 h-10 text-amber-500" />
    },
    {
        title: "Plánujte výlety",
        description: "Jednoduše naplánujte a zaznamenejte vaše dobrodružství.",
        icon: <Calendar className="w-10 h-10 text-amber-500" />
    },
    {
        title: "Získejte odměny",
        description: "Sbírejte body a získejte ocenění za vaše cesty.",
        icon: <Award className="w-10 h-10 text-amber-500" />
    }
];

const Home = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            {/* Hero Section */}
            <div className="animate-fadeIn">
                <div className={"grid grid-cols-1 md:grid-cols-2 w-full"}>
                    <div className={"p-8 hidden md:flex z-10 w-full flex-col items-start justify-center h-full cursor-default"}>
                        <h1 className="text-7xl font-bold mb-4 ">
                            {basicInfo.name}
                        </h1>
                        <p className="text-6xl font-semibold mb-4 text-gray-700/60">
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
                    <p className="text-5xl md:hidden text-center font-semibold mt-4 text-gray-700/60">
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
            </div>
            
            <Separator className="my-8" />
            
            {/* News Section */}
            <div className="animate-fadeIn animation-delay-300">
                <News/>
            </div>
            
            <Separator className="my-8" />
            
            {/* Featured Locations Section */}
            <div className="p-8 animate-fadeIn animation-delay-600">
                <h2 className="text-4xl font-bold mb-6">Objevte zajímavá místa</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredLocations.map((location) => (
                        <Card key={location.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className="relative h-48">
                                <Image 
                                    src={location.image} 
                                    alt={location.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    priority={location.id === 1}
                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2">{location.title}</h3>
                                <p className="text-gray-500 mb-4">{location.description}</p>
                                <Button variant="ghost" className="group">
                                    Více informací
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            
            <Separator className="my-8" />
            
            {/* Benefits Section */}
            <div className="bg-gray-50 p-8 rounded-3xl animate-fadeIn animation-delay-900">
                <h2 className="text-4xl font-bold mb-10 text-center">Proč Strakatá turistika?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all">
                            <div className="mb-4 p-3 bg-amber-100 rounded-full">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                            <p className="text-gray-500">{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Call to Action Section */}
            <div className="p-12 text-center animate-fadeIn animation-delay-1200 my-12">
                <h2 className="text-4xl font-bold mb-4">Připojte se k naší komunitě</h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Staňte se součástí komunity milovníků strakatých psů a objevujte krásy České republiky společně s námi.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button size="lg" className="rounded-full">
                        Registrujte se nyní
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-full">
                        Zjistit více
                    </Button>
                </div>
            </div>
        </CommonPageTemplate>
    );
}

export default Home;