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
        title: "Objevujte nov&aacute; m&iacute;sta",
        description: "Prozkoumejte nezn&aacute;m&aacute; m&iacute;sta s vaš&iacute;m ps&iacute;m parť&aacute;kem.",
        icon: <MapPin className="w-10 h-10 text-amber-500" />
    },
    {
        title: "Pl&aacute;nujte v&yacute;lety",
        description: "Jednoduše napl&aacute;nujte a zaznamenejte vaše dobrodružstv&iacute;.",
        icon: <Calendar className="w-10 h-10 text-amber-500" />
    },
    {
        title: "Z&iacute;skejte odměny",
        description: "Sb&iacute;rejte body a z&iacute;skejte oceněn&iacute; za vaše cesty.",
        icon: <Award className="w-10 h-10 text-amber-500" />
    }
];

const tutorialSteps = [
    "Vyberte trasu",
    "Nahrajte GPS data",
    "Přidejte fotky",
    "Z&iacute;skejte body"
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
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} showHeaderGap={false} className='p-0'>
            {/* Hero Section with Background Image */}
            <div className="relative w-full h-[70vh] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 w-full h-full">
                    <Image
                        src="/images/mainBackground.png"
                        alt="Strakat&aacute; turistika background"
                        fill
                        className="object-cover rounded-b-[2rem]"
                        priority
                    />
                    {/* Dark linear gradient overlay from left to right */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent rounded-b-[2rem]"></div>
                </div>
                
                {/* Original Hero Section Content */}
                <div className="relative z-10 animate-fadeIn">
                    <div className={"grid grid-cols-1 md:grid-cols-[55%_45%] w-full h-[70vh] px-8"}>
                        <div className={"p-8 hidden md:flex z-10 w-full flex-col items-start justify-center h-full cursor-default"}>
                             <h1 className="text-[90px] font-semibold whitespace-nowrap overflow-visible text-white">
                                  {basicInfo.name}
                            </h1>   
                            <div className="text-6xl font-semibold mb-4 text-white w-[90%]">
                                aneb pozn&aacute;v&aacute;me
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
                                s česk&yacute;m strakat&yacute;m
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
                                <IOSButton variant="outline" className={"rounded-full hover:scale-105 transition-all duration-300 ease-out text-white border-white hover:bg-white hover:text-black"}>
                                    Prozkoumat
                                </IOSButton>
                            </div>
                        </div>
                        <div className="text-5xl md:hidden text-center font-semibold mt-4 text-white">
                            aneb pozn&aacute;v&aacute;me
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
                                s česk&yacute;m strakat&yacute;m
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
                            <IOSButton variant="outline" className={"rounded-full hover:scale-105 transition-all duration-300 ease-out text-white border-white hover:bg-white hover:text-black"}>
                                Prozkoumat
                            </IOSButton>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Stats Section */}
                <div className="px-8 py-16 animate-fadeIn animation-delay-400 my-8 md:my-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <IOSStatsCard
                        title="Aktivn&iacute;ch uživatelů"
                        value="2,847"
                        icon={<Users className="w-5 h-5" />}
                        variant="info"
                        className="text-center hover:scale-105 transition-all duration-500 ease-out"
                    />
                    <IOSStatsCard
                        title="Navšt&iacute;ven&yacute;ch míst"
                        value="15,392"
                        icon={<MapPin className="w-5 h-5" />}
                        variant="success"
                        className="text-center hover:scale-105 transition-all duration-500 ease-out"
                    />
                    <IOSStatsCard
                        title="Nahran&yacute;ch fotek"
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
                        Zač&iacute;t je jednoduch&eacute;
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Stač&iacute; čtyři kroky a můžete se vydat na dobrodružstv&iacute; s vaš&iacute;m čtyřnoh&yacute;m parť&aacute;kem. 
                        Každ&yacute; krok je navržen tak, aby byl intuitivn&iacute; a z&aacute;bavn&yacute;.
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
                                    {index === 0 && "Vyberte si trasu z naš&iacute; rozs&aacute;hl&eacute; datab&aacute;ze nebo vytvořte vlastn&iacute; podle vašich preferenc&iacute;"}
                                    {index === 1 && "Nahrajte GPS data z vašeho v&yacute;letu a sledujte svou trasu v re&aacute;ln&eacute;m čase"}
                                    {index === 2 && "Přidejte fotky z vašeho dobrodružstv&iacute; a sd&iacute;lejte kr&aacute;sne momenty s komunitou"}
                                    {index === 3 && "Z&iacute;skejte body za každou n&aacute;vštěvu a soutěžte s ostatn&iacute;mi v žebř&iacute;čc&iacute;ch"}
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