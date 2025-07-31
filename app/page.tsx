import Image from 'next/image';

import CommonPageTemplate from "@/components/structure/CommonPageTemplate";


import basicInfo from "@/lib/settings/basicInfo";
import {Separator} from "@/components/ui/separator";
import React from "react";


import { currentUser } from "@/lib/auth";
import { currentRole } from "@/lib/auth";
import DogEmoji from "@/assets/img/dogEmoji.png";
import PinEmoji from "@/assets/img/mapEmoji.png";
import Showcase1 from "@/assets/img/showcase/1.png";
import Showcase2 from "@/assets/img/showcase/3.png";
import Showcase3 from "@/assets/img/showcase/2.png";
import News from "@/components/blocks/News";
import { MapPin, Calendar, Award, Users, Trophy, Sparkles, Camera, CheckCircle } from "lucide-react";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSImageShowcase } from "@/components/ui/ios/image-showcase";
import { IOSStatsCard } from "@/components/ui/ios/stats-card";
import { IOSStepProgress } from "@/components/ui/ios/step-progress";

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

const tutorialSteps = [
    "Vyberte trasu",
    "Nahrajte GPS data",
    "Přidejte fotky",
    "Získejte body"
];

const tutorialStepImages = [
    "/icons/soutez/1.png",
    "/icons/soutez/2.png", 
    "/icons/soutez/3.png",
    "/icons/soutez/1.png"
];





const Home = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role}>
            {/* Hero Section */}
            <div className="animate-fadeIn border-2 border-black">
                <div className={"grid grid-cols-1 md:grid-cols-[55%_45%] w-full h-[70vh] px-8 border-2 border-black"}>
                    <div className={"p-8 hidden md:flex z-10 w-full flex-col items-start justify-center h-full  border-2 border-black cursor-default"}>
                         <h1 className="text-[90px] font-semibold whitespace-nowrap overflow-visible">
                              {basicInfo.name}
                        </h1>   
                        <div className="text-6xl font-semibold mb-4 text-gray-700/60 w-[90%]">
                            aneb poznáváme
                            {" "}
                            <IOSBadge
                                label="Česko"
                                icon={PinEmoji}
                                specialStyle={{ iconSize: 120 }}
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
                                specialStyle={{ iconSize: 120 }}
                                bgColor="bg-amber-200/80"
                                borderColor="border-amber-400/70"
                                textColor="text-amber-900/80"
                            />
                            .
                        </div>
                        <div className={"flex gap-x-2 flex-row items-center justify-start py-4 w-full"}>
                            <IOSButton variant="outline" className={"rounded-full hover:scale-105 transition-all duration-300 ease-out"}>
                                Prozkoumat
                            </IOSButton>
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
                                specialStyle={{ iconSize: 24 }}
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
                                specialStyle={{ iconSize: 24 }}
                                bgColor="bg-amber-200/80"
                                borderColor="border-amber-400/70"
                                textColor="text-amber-900/80"
                            />
                        .
                    </div>
                    <div className={"flex md:hidden flex-row items-center justify-center py-4 w-full"}>
                        <IOSButton variant="outline" className={"rounded-full hover:scale-105 transition-all duration-300 ease-out"}>
                            Prozkoumat
                        </IOSButton>
                    </div>
                </div>
            </div>
            
                 {/* Stats Section */}
                <div className="px-8 py-16 animate-fadeIn animation-delay-400 my-8 md:my-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <IOSStatsCard
                        title="Aktivních uživatelů"
                        value="2,847"
                        icon={<Users className="w-5 h-5" />}
                        variant="info"
                        className="text-center hover:scale-105 transition-all duration-500 ease-out"
                    />
                    <IOSStatsCard
                        title="Navštívených míst"
                        value="15,392"
                        icon={<MapPin className="w-5 h-5" />}
                        variant="success"
                        className="text-center hover:scale-105 transition-all duration-500 ease-out"
                    />
                    <IOSStatsCard
                        title="Nahraných fotek"
                        value="89,234"
                        icon={<Camera className="w-5 h-5" />}
                        variant="warning"
                        className="text-center hover:scale-105 transition-all duration-500 ease-out"
                    />
                    <IOSStatsCard
                        title="Celkem bodů"
                        value="1.2M"
                        icon={<Trophy className="w-5 h-5" />}
                        variant="default"
                        className="text-center hover:scale-105 transition-all duration-500 ease-out"
                    />
                </div>
            </div>

            
            <Separator className="my-8" />
            
            {/* News Section */}
            <div className="animate-fadeIn animation-delay-300">
                <News/>
            </div>
            
            <Separator className="my-8" />
            
       
            {/* Tutorial Section */}
            <div className="px-8 py-20 bg-gradient-to-br from-blue-50/60 via-white/40 to-amber-50/60 rounded-[40px] mx-8 animate-fadeIn animation-delay-500 backdrop-blur-sm border border-white/20 shadow-2xl shadow-blue-500/5 my-8 md:my-16">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-100/50 rounded-full border border-blue-200/50">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Jak to funguje</span>
                    </div>
                    <h2 className="text-5xl font-bold mb-6 text-gray-900 bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
                        Začít je jednoduché
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Stačí čtyři kroky a můžete se vydat na dobrodružství s vaším čtyřnohým parťákem. 
                        Každý krok je navržen tak, aby byl intuitivní a zábavný.
                    </p>
                </div>
                
                <div className="mb-16">
                    <IOSStepProgress
                        steps={tutorialSteps}
                        currentStep={4}
                        stepImages={tutorialStepImages}
                        className="max-w-5xl mx-auto"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {tutorialSteps.map((step, index) => (
                        <IOSCard
                            key={index}
                            className="text-center hover:scale-105 hover:-translate-y-2 transition-all duration-700 ease-out group cursor-pointer"
                        >
                            <div className="flex flex-col items-center p-6">
                                <div className="relative mb-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 ease-out shadow-lg shadow-blue-500/25">
                                        <span className="text-2xl font-bold text-white">{index + 1}</span>
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{step}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {index === 0 && "Vyberte si trasu z naší rozsáhlé databáze nebo vytvořte vlastní podle vašich preferencí"}
                                    {index === 1 && "Nahrajte GPS data z vašeho výletu a sledujte svou trasu v reálném čase"}
                                    {index === 2 && "Přidejte fotky z vašeho dobrodružství a sdílejte krásné momenty s komunitou"}
                                    {index === 3 && "Získejte body za každou návštěvu a soutěžte s ostatními v žebříčcích"}
                                </p>
                            </div>
                        </IOSCard>
                    ))}
                </div>


            </div>




            



            

            

        </CommonPageTemplate>
    );
}

export default Home;