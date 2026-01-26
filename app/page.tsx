import Image from 'next/image';

import CommonPageTemplate from "@/components/structure/CommonPageTemplate";


import basicInfo from "@/lib/settings/basicInfo";
import { Separator } from "@/components/ui/separator";
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
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role} showHeaderGap={false} className='p-0'>
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
                            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold whitespace-normal break-words text-white tracking-tight leading-none mb-2 drop-shadow-lg">
                                {basicInfo.name}
                            </h1>
                            <div className="text-3xl lg:text-4xl xl:text-6xl font-semibold mb-6 text-white w-[90%] drop-shadow-md">
                                aneb pozn&aacute;v&aacute;me
                                {" "}
                                <IOSBadge
                                    label="Česko"
                                    icon={PinEmoji}
                                    specialStyle={{ iconSize: 120 }}
                                    bgColor="bg-red-200"
                                    borderColor="border-red-400"
                                    textColor="text-red-900"
                                />
                                {" "}
                                s česk&yacute;m strakat&yacute;m
                                {" "}
                                <IOSBadge
                                    label="psem"
                                    icon={DogEmoji}
                                    specialStyle={{ iconSize: 120 }}
                                    bgColor="bg-amber-200"
                                    borderColor="border-amber-400"
                                    textColor="text-amber-900"
                                />
                                .
                            </div>
                            <div className={"flex gap-x-4 flex-row items-center justify-start py-8 mt-4 w-full"}>
                                <Link href="/soutez">
                                    <IOSButton variant="primary" className={"h-12 px-8 text-lg font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-blue-900/20"}>
                                        Soutěžit
                                    </IOSButton>
                                </Link>
                                <Link href="https://play.google.com/store/apps/details?id=com.strakataturistika.app" target="_blank" rel="noopener noreferrer">
                                    <IOSButton variant="secondary" className={"h-12 px-6 text-base font-semibold rounded-full hover:scale-105 transition-all duration-300 bg-white/20 text-white border-white/40 hover:bg-white/30 backdrop-blur-md"}>
                                        Stáhnout aplikaci
                                    </IOSButton>
                                </Link>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center mt-6 px-4 md:hidden z-20">
                            <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-4">
                                {basicInfo.name}
                            </h1>

                            <div className="flex flex-col w-full max-w-xs gap-3">
                                <Link href="/soutez" className="w-full">
                                    <button className="w-full bg-white text-black font-bold text-lg py-3.5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all duration-300">
                                        Soutěžit
                                    </button>
                                </Link>
                                <Link href="https://play.google.com/store/apps/details?id=com.strakataturistika.app" className="w-full" target="_blank" rel="noopener noreferrer">
                                    <button className="w-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-lg py-3.5 rounded-2xl shadow-lg hover:bg-white/30 active:scale-95 transition-all duration-300">
                                        Stáhnout aplikaci
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section - Desktop Overlay / Mobile Separate */}
                <div className="hidden md:block absolute bottom-0 left-0 right-0 z-20 px-8 translate-y-1/2">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-4 gap-6">
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40 transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="text-3xl font-black text-gray-900 mb-1">147</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Unikátních uživatelů</div>
                                <div className="mt-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40 transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="text-3xl font-black text-gray-900 mb-1">25,083</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Navštívených míst</div>
                                <div className="mt-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40 transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="text-3xl font-black text-gray-900 mb-1">5</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Proběhlých sezón</div>
                                <div className="mt-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-600">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/40 transform hover:-translate-y-1 transition-transform duration-300">
                                <div className="text-3xl font-black text-gray-900 mb-1">28,268</div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Celkem bodů</div>
                                <div className="mt-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto text-yellow-600">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Stats Section - Below Hero */}
            <div className="md:hidden px-4 -mt-8 relative z-30">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-gray-900">147</span>
                        <span className="text-xs font-bold text-gray-400 uppercase mt-1">Uživatelů</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-gray-900">25k</span>
                        <span className="text-xs font-bold text-gray-400 uppercase mt-1">Míst</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-gray-900">5</span>
                        <span className="text-xs font-bold text-gray-400 uppercase mt-1">Sezón</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-black text-gray-900">28k</span>
                        <span className="text-xs font-bold text-gray-400 uppercase mt-1">Bodů</span>
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