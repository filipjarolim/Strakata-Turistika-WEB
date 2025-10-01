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
import { MapPin, Calendar, Award, Users, Trophy, Camera } from "lucide-react";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCard } from "@/components/ui/ios/card";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSImageShowcase } from "@/components/ui/ios/image-showcase";
import { IOSStatsCard } from "@/components/ui/ios/stats-card";
import Link from "next/link";


const benefits = [
    {
        title: "Objevujte nov&aacute; m&iacute;sta",
        description: "Prozkoumejte nezn&aacute;m&aacute; m&iacute;sta s vaš&iacute;m ps&iacute;m parť&aacute;kem.",
        icon: <MapPin className="w-10 h-10" style={{ color: '#4CAF50' }} />
    },
    {
        title: "Pl&aacute;nujte v&yacute;lety",
        description: "Jednoduše napl&aacute;nujte a zaznamenejte vaše dobrodružstv&iacute;.",
        icon: <Calendar className="w-10 h-10" style={{ color: '#4CAF50' }} />
    },
    {
        title: "Z&iacute;skejte odměny",
        description: "Sb&iacute;rejte body a z&iacute;skejte oceněn&iacute; za vaše cesty.",
        icon: <Award className="w-10 h-10" style={{ color: '#4CAF50' }} />
    }
];







const Home = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} showHeaderGap={false} className='p-0'>
            {/* Hero Section with Background Image */}
            <div className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] overflow-visible">
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
                    <div className={"grid grid-cols-1 md:grid-cols-[55%_45%] w-full h-[50vh] sm:h-[60vh] md:h-[70vh] px-3 sm:px-4 md:px-8"}>
                        <div className={"p-3 sm:p-4 md:p-8 hidden md:flex z-10 w-full flex-col items-start justify-center h-full cursor-default"}>
                             <h1 className="text-[48px] lg:text-[72px] xl:text-[96px] font-semibold whitespace-normal break-words text-white">
                                   {basicInfo.name}
                             </h1>   
                            <div className="text-3xl lg:text-4xl xl:text-6xl font-semibold mb-4 text-white w-[90%]">
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
                                <Link href="/soutez">
                                    <IOSButton variant="outline" className={"rounded-full hover:scale-105 transition-all duration-300 ease-out text-white hover:text-white border-white/50 bg-white/20 backdrop-blur-xl hover:bg-white/30"}>
                                        Prozkoumat
                                    </IOSButton>
                                </Link>
                            </div>
                        </div>
                        <div className="text-2xl sm:text-3xl md:text-5xl text-center font-semibold mt-2 sm:mt-4 px-2 text-white md:hidden">
                            <div className="mb-2 sm:mb-3">
                                <span className="text-xl sm:text-3xl font-semibold">{basicInfo.name}</span>
                            </div>
                            <div className="leading-relaxed text-lg sm:text-xl font-medium">
                                aneb poznáváme Česko s českým strakatým psem.
                            </div>
                        </div>
                        <div className={"flex md:hidden flex-row items-center justify-center py-3 sm:py-4 w-full px-2"}>
                            <Link href="/soutez">
                                <IOSButton variant="outline" className={"rounded-full hover:scale-105 transition-all duration-300 ease-out text-white hover:text-white border-white/50 bg-white/20 backdrop-blur-xl hover:bg-white/30 text-sm sm:text-base px-4 sm:px-6"}>
                                    Prozkoumat
                                </IOSButton>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Section - Inside Hero Container */}
                <div className="absolute bottom-0 left-0 right-0 z-20 px-3 sm:px-4 md:px-8 pb-3 sm:pb-4 md:pb-8" style={{ transform: 'translateY(55%)' }}>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                            <div className="text-center">
                                <div className="md:hidden w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center mx-auto">
                                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">147</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight mt-1">Unikátních uživatelů</div>
                                </div>
                                <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 shadow-lg">
                                    <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 mb-1">147</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Unikátních uživatelů</div>
                                    <div className="mt-1 sm:mt-2">
                                        <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 mx-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="md:hidden w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center mx-auto">
                                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">25,083</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight mt-1">Navštívených míst</div>
                                </div>
                                <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 shadow-lg">
                                    <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 mb-1">25,083</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Navštívených míst</div>
                                    <div className="mt-1 sm:mt-2">
                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 mx-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="md:hidden w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center mx-auto">
                                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">5</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight mt-1">Sezón</div>
                                </div>
                                <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 shadow-lg">
                                    <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 mb-1">5</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Sezón</div>
                                    <div className="mt-1 sm:mt-2">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 mx-auto" />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="md:hidden w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white/80 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center mx-auto">
                                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">28,268</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight mt-1">Celkem bodů</div>
                                </div>
                                <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 shadow-lg">
                                    <div className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 mb-1">28,268</div>
                                    <div className="text-[10px] sm:text-xs text-gray-600 leading-tight">Celkem bodů</div>
                                    <div className="mt-1 sm:mt-2">
                                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 mx-auto" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* News Section - Moved to top */}
            <div className="px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-16 bg-gray-50 mt-6 sm:mt-8">
                <News showHeader={false} showAddButton={false} />
            </div>
            
            {/* Benefits Section */}
            <div className="px-3 sm:px-4 md:px-8 py-12 sm:py-16 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">Proč se připojit?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="text-center">
                                <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 md:p-8">
                                    <div className="mb-3 sm:mb-4 flex justify-center items-center">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3" dangerouslySetInnerHTML={{ __html: benefit.title }} />
                                    <p className="text-sm md:text-base text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: benefit.description }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            

            
            <Separator className="my-8" />
            
            





            



            

            

        </CommonPageTemplate>
    );
}

export default Home;