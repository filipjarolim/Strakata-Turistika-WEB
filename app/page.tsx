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
import Showcase1 from "@/assets/img/showcase/1.png";
import Showcase2 from "@/assets/img/showcase/3.png";
import Showcase3 from "@/assets/img/showcase/2.png";
import News from "@/components/blocks/News";
import { MapPin, Calendar, Award, ArrowRight } from "lucide-react";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSImageShowcase } from "@/components/ui/ios/image-showcase";



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
                <div className={"grid grid-cols-1 md:grid-cols-[55%_45%] w-full px-8"}>
                    <div className={"p-8 hidden md:flex z-10 w-full flex-col items-start justify-center h-full cursor-default"}>
                         <h1 className="text-[90px] font-semibold whitespace-nowrap overflow-visible">
                              {basicInfo.name}
                        </h1>   
                        <div className="text-6xl font-semibold mb-4 text-gray-700/60 w-[90%]">
                            aneb poznáváme
                            {" "}
                            <IOSBadge
                                label="Česko"
                                icon={PinEmoji}
                                size={100}
                                bgColor="bg-red-200/80"
                                borderColor="border-red-400/70"
                                textColor="text-red-900/80"
                            />
                            {" "}
                            s českým strakatým
                            {" "}
                            <IOSBadge
                                label="psem"
                                icon={DogEmoji}
                                size={156}
                                bgColor="bg-amber-200/80"
                                borderColor="border-amber-400/70"
                                textColor="text-amber-900/80"
                            />
                            .
                        </div>
                        <div className={"flex gap-x-2 flex-row items-center justify-start py-4 w-full"}>
                            <IOSButton variant="outline" className={"rounded-full"}>
                                Prozkoumat
                            </IOSButton>
                            <InstallButton/>
                        </div>
                    </div>
                    <div className={"flex flex-row items-center justify-center select-none"}>
                        <IOSImageShowcase 
                            images={[
                                { url: Showcase1, alt: "Showcase 1" },
                                { url: Showcase2, alt: "Showcase 2" },
                                { url: Showcase3, alt: "Showcase 3" }
                            ]}
                            layout="overlap"
                            mainWidth={320}
                            mainHeight={420}
                            sideWidth={220}
                            sideHeight={300}
                        />
                    </div>
                    <div className="text-5xl md:hidden text-center font-semibold mt-4 text-gray-700/60">
                        aneb poznáváme
                        {" "}
                        <IOSBadge
                                label="Česko"
                                icon={PinEmoji}
                                size={32}
                                bgColor="bg-red-200/80"
                                borderColor="border-red-400/70"
                                textColor="text-red-900/80"
                            />
                            {" "}
                            s českým strakatým
                            {" "}
                            <IOSBadge
                                label="psem"
                                icon={DogEmoji}
                                size={96}
                                bgColor="bg-amber-200/80"
                                borderColor="border-amber-400/70"
                                textColor="text-amber-900/80"
                            />
                        .
                    </div>
                    <div className={"flex md:hidden flex-row items-center justify-center py-4 w-full"}>
                        <IOSButton variant="outline" className={"rounded-full"}>
                            Prozkoumat
                        </IOSButton>
                        <InstallButton/>
                    </div>
                </div>
            </div>
            
            # here add the content
            
            <Separator className="my-8" />
            
            {/* News Section */}
            <div className="animate-fadeIn animation-delay-300">
                <News/>
            </div>
            
            <Separator className="my-8" />
            
            {/* Showcase Section */}
            <div className="p-8 animate-fadeIn animation-delay-600">
                <h2 className="text-4xl font-bold mb-6 text-center">Prozkoumejte krásy přírody</h2>
                <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
                    Od hustých lesů přes majestátní hory až po křišťálová jezera - objevte nejkrásnější místa České republiky se svým čtyřnohým společníkem.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                    <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] transform hover:-translate-y-2 transition-all duration-300">
                        <Image
                            src={Showcase1}
                            alt="Majestátní hory"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                            <h3 className="text-2xl font-bold mb-2">Křišťálová jezera</h3>
                            <p className="text-sm text-gray-200">Osvěžte se u průzračných horských jezer</p>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] transform hover:-translate-y-2 transition-all duration-300 md:translate-y-12">
                        <Image
                            src={Showcase2}
                            alt="Husté lesy"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                            <h3 className="text-2xl font-bold mb-2">Husté lesy</h3>
                            <p className="text-sm text-gray-200">Prozkoumejte tajemná zákoutí našich lesů</p>
                        </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-2xl aspect-[3/4] transform hover:-translate-y-2 transition-all duration-300">
                        <Image
                            src={Showcase3}
                            alt="Křišťálová jezera"
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                            <h3 className="text-2xl font-bold mb-2">Majestátní hory</h3>
                            <p className="text-sm text-gray-200">Zdolejte vrcholy a užijte si dechberoucí výhledy do krajiny</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <Separator className="my-8" />
            
            {/* Benefits Section */}
            <div className="bg-gray-50 p-8 rounded-3xl animate-fadeIn animation-delay-900">
                <h2 className="text-4xl font-bold mb-10 text-center">Proč Strakatá turistika?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <IOSCard
                            key={index}
                            className="hover:shadow-xl transition-all duration-300"
                        >
                            <div className="flex flex-col items-center text-center">
                                <IOSCircleIcon
                                    variant="amber"
                                    size="lg"
                                    className="mb-6"
                                >
                                    {benefit.icon}
                                </IOSCircleIcon>
                                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                                <p className="text-gray-500">{benefit.description}</p>
                            </div>
                        </IOSCard>
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
                    <IOSButton size="lg" className="rounded-full">
                        Registrujte se nyní
                    </IOSButton>
                    <IOSButton variant="outline" size="lg" className="rounded-full">
                        Zjistit více
                    </IOSButton>
                </div>
            </div>
        </CommonPageTemplate>
    );
}

export default Home;