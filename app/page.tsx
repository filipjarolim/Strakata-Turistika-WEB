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
import DogEmoji from "@/assets/img/dogEmoji.png";
import PinEmoji from "@/assets/img/mapEmoji.png";
import Showcase1 from "@/assets/img/showcase/1.png";
import Showcase2 from "@/assets/img/showcase/3.png";
import Showcase3 from "@/assets/img/showcase/2.png";
import News from "@/components/blocks/News";
import { MapPin, Calendar, Award, ArrowRight, Play, Users, Trophy, Heart, Star, Download, Camera, Route, CheckCircle, Sparkles } from "lucide-react";
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

const features = [
    {
        icon: <Camera className="w-6 h-6" />,
        title: "Fotogalerie",
        description: "Sdílejte krásné momenty s vaším psem",
        color: "blue"
    },
    {
        icon: <Route className="w-6 h-6" />,
        title: "GPS sledování",
        description: "Zaznamenejte každý krok vašeho dobrodružství",
        color: "red"
    },
    {
        icon: <Trophy className="w-6 h-6" />,
        title: "Bodový systém",
        description: "Soutěžte s ostatními a sbírejte ocenění",
        color: "amber"
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Komunita",
        description: "Připojte se k milovníkům strakatých psů",
        color: "default"
    }
];

const testimonials = [
    {
        name: "Petra Nováková",
        role: "Majitelka českého strakatého",
        content: "Díky Strakaté turistice objevujeme místa, o kterých jsme ani nevěděli. Náš Max je nadšený z každého výletu!",
        rating: 5
    },
    {
        name: "Jan Svoboda",
        role: "Aktivní turista",
        content: "Skvělá aplikace pro všechny, kteří chtějí trávit čas s psem v přírodě. GPS sledování funguje perfektně.",
        rating: 5
    },
    {
        name: "Marie Černá",
        role: "Začátečnice",
        content: "Jako začátečnice jsem ocenila jednoduchost použití. Komunita je velmi přátelská a pomohla mi s prvními kroky.",
        rating: 5
    }
];

const Home = async () => {

    const user = await currentUser()
    const role = await currentRole()

    return (
        <CommonPageTemplate contents={{complete: true}} currentUser={user} currentRole={role} showOfflineController={true}>
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
                        <InstallButton/>
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

                <div className="text-center mt-16">
                    <IOSButton size="lg" className="rounded-full hover:scale-105 transition-all duration-300 ease-out shadow-lg shadow-blue-500/25">
                        <Play className="w-5 h-5 mr-2" />
                        Podívat se na demo
                    </IOSButton>
                </div>
            </div>

            {/* Features Section */}
            <div className="px-8 py-20 animate-fadeIn animation-delay-600 my-8 md:my-16">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-amber-100/50 rounded-full border border-amber-200/50">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Vše co potřebujete</span>
                    </div>
                    <h2 className="text-5xl font-bold mb-6 text-gray-900">
                        Kompletní řešení pro vaše dobrodružství
                    </h2>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                        Naše aplikace nabízí vše potřebné pro perfektní výlety s vaším psem. 
                        Od plánování až po sdílení zážitků - máme to pokryté.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {features.map((feature, index) => (
                        <IOSCard
                            key={index}
                            className="text-center hover:scale-105 hover:-translate-y-3 transition-all duration-700 ease-out group cursor-pointer"
                        >
                            <div className="flex flex-col items-center p-8">
                                <IOSCircleIcon
                                    variant={feature.color as "blue" | "red" | "amber" | "default"}
                                    size="lg"
                                    className="mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out"
                                >
                                    {feature.icon}
                                </IOSCircleIcon>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-base">{feature.description}</p>
                            </div>
                        </IOSCard>
                    ))}
                </div>
            </div>

            {/* Showcase Section - Enhanced */}
            <div className="px-8 py-20 animate-fadeIn animation-delay-700 my-8 md:my-16">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-green-100/50 rounded-full border border-green-200/50">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Objevte krásy přírody</span>
                    </div>
                    <h2 className="text-5xl font-bold mb-6 text-gray-900">
                        Prozkoumejte nejkrásnější místa
                    </h2>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                    Od hustých lesů přes majestátní hory až po křišťálová jezera - objevte nejkrásnější místa České republiky se svým čtyřnohým společníkem.
                </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative max-w-7xl mx-auto">
                    <div className="group relative overflow-hidden rounded-[32px] aspect-[3/4] transform hover:-translate-y-4 transition-all duration-700 ease-out cursor-pointer">
                        <Image
                            src={Showcase1}
                            alt="Křišťálová jezera"
                            fill
                            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <h3 className="text-3xl font-bold mb-4 group-hover:text-blue-200 transition-colors duration-300">Křišťálová jezera</h3>
                            <p className="text-base text-gray-200 mb-6 leading-relaxed">Osvěžte se u průzračných horských jezer a užijte si klid přírody</p>
                            <IOSButton variant="outline" size="sm" className="rounded-full hover:scale-105 transition-all duration-300 ease-out">
                                Objevit
                            </IOSButton>
                        </div>
                        <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    
                    <div className="group relative overflow-hidden rounded-[32px] aspect-[3/4] transform hover:-translate-y-4 transition-all duration-700 ease-out cursor-pointer md:translate-y-12">
                        <Image
                            src={Showcase2}
                            alt="Husté lesy"
                            fill
                            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <h3 className="text-3xl font-bold mb-4 group-hover:text-green-200 transition-colors duration-300">Husté lesy</h3>
                            <p className="text-base text-gray-200 mb-6 leading-relaxed">Prozkoumejte tajemná zákoutí našich lesů a objevte skryté poklady</p>
                            <IOSButton variant="outline" size="sm" className="rounded-full hover:scale-105 transition-all duration-300 ease-out">
                                Objevit
                            </IOSButton>
                        </div>
                        <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    
                    <div className="group relative overflow-hidden rounded-[32px] aspect-[3/4] transform hover:-translate-y-4 transition-all duration-700 ease-out cursor-pointer">
                        <Image
                            src={Showcase3}
                            alt="Majestátní hory"
                            fill
                            className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
                        <div className="absolute bottom-0 left-0 p-8 text-white">
                            <h3 className="text-3xl font-bold mb-4 group-hover:text-purple-200 transition-colors duration-300">Majestátní hory</h3>
                            <p className="text-base text-gray-200 mb-6 leading-relaxed">Zdolejte vrcholy a užijte si dechberoucí výhledy do krajiny</p>
                            <IOSButton variant="outline" size="sm" className="rounded-full hover:scale-105 transition-all duration-300 ease-out">
                                Objevit
                            </IOSButton>
                        </div>
                        <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                            <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Benefits Section - Enhanced */}
            <div className="px-8 py-20 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-red-50/60 rounded-[40px] mx-8 animate-fadeIn animation-delay-800 backdrop-blur-sm border border-white/20 shadow-2xl shadow-amber-500/5 my-8 md:my-16">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-amber-100/50 rounded-full border border-amber-200/50">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Proč Strakatá turistika</span>
                    </div>
                    <h2 className="text-5xl font-bold mb-6 text-gray-900">
                        Výhody, které vás přesvědčí
                    </h2>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                        Objevte výhody, které vám naše platforma přináší a proč se k nám připojují tisíce spokojených uživatelů.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
                    {benefits.map((benefit, index) => (
                        <IOSCard
                            key={index}
                            className="hover:scale-105 hover:-translate-y-3 transition-all duration-700 ease-out group cursor-pointer"
                        >
                            <div className="flex flex-col items-center text-center p-8">
                                <IOSCircleIcon
                                    variant="amber"
                                    size="lg"
                                    className="mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out"
                                >
                                    {benefit.icon}
                                </IOSCircleIcon>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-amber-600 transition-colors duration-300">{benefit.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-base">{benefit.description}</p>
                            </div>
                        </IOSCard>
                    ))}
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="px-8 py-20 animate-fadeIn animation-delay-900 my-8 md:my-16">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-purple-100/50 rounded-full border border-purple-200/50">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">Co říkají naši uživatelé</span>
                    </div>
                    <h2 className="text-5xl font-bold mb-6 text-gray-900">
                        Spokojení majitelé strakatých psů
                    </h2>
                    <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                        Připojte se k tisícům spokojených majitelů strakatých psů, kteří už objevují krásy České republiky s námi.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <IOSCard
                            key={index}
                            className="hover:scale-105 hover:-translate-y-3 transition-all duration-700 ease-out cursor-pointer"
                        >
                            <div className="flex flex-col h-full p-8">
                                <div className="flex items-center mb-6">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-8 flex-grow leading-relaxed text-lg italic">
                                    &ldquo;{testimonial.content}&rdquo;
                                </p>
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-bold text-gray-900 text-lg">{testimonial.name}</h4>
                                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                                </div>
                            </div>
                        </IOSCard>
                    ))}
                </div>
            </div>
            
            {/* Download CTA Section */}
            <div className="px-8 py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-[40px] mx-8 animate-fadeIn animation-delay-1000 backdrop-blur-sm border border-white/20 shadow-2xl shadow-blue-500/20 my-8 md:my-16">
                <div className="text-center text-white">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-sm font-medium text-white">Začněte ještě dnes</span>
                    </div>
                    <h2 className="text-5xl font-bold mb-6">Začněte svou cestu ještě dnes</h2>
                    <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Stáhněte si aplikaci a připojte se k největší komunitě milovníků strakatých psů v Česku. 
                        Vaše dobrodružství čeká!
                    </p>
                    
                    <div className="flex flex-wrap gap-6 justify-center mb-12">
                        <IOSButton size="lg" className="rounded-full bg-white text-blue-600 hover:bg-gray-100 hover:scale-105 transition-all duration-300 ease-out shadow-lg shadow-black/20">
                            <Download className="w-5 h-5 mr-2" />
                            Stáhnout aplikaci
                        </IOSButton>
                        <IOSButton variant="outline" size="lg" className="rounded-full border-white text-white hover:bg-white/10 hover:scale-105 transition-all duration-300 ease-out">
                            <Play className="w-5 h-5 mr-2" />
                            Podívat se na demo
                        </IOSButton>
                    </div>

                    <div className="flex items-center justify-center gap-10 text-blue-100">
                        <div className="flex items-center gap-3 hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-medium">Zdarma ke stažení</span>
                        </div>
                        <div className="flex items-center gap-3 hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-medium">Bez reklam</span>
                        </div>
                        <div className="flex items-center gap-3 hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-medium">Offline režim</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Final CTA Section */}
            <div className="px-8 py-20 text-center animate-fadeIn animation-delay-1100 my-8 md:my-16">
                <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-red-100/50 rounded-full border border-red-200/50">
                    <Sparkles className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Připojte se k nám</span>
                </div>
                <h2 className="text-5xl font-bold mb-6 text-gray-900">
                    Připojte se k naší komunitě
                </h2>
                <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Staňte se součástí komunity milovníků strakatých psů a objevujte krásy České republiky společně s námi.
                    Každý nový člen je vítán s otevřenou náručí!
                </p>
                <div className="flex flex-wrap gap-6 justify-center">
                    <IOSButton size="lg" className="rounded-full hover:scale-105 transition-all duration-300 ease-out shadow-lg shadow-red-500/25">
                        <Heart className="w-5 h-5 mr-2" />
                        Registrujte se nyní
                    </IOSButton>
                    <IOSButton variant="outline" size="lg" className="rounded-full hover:scale-105 transition-all duration-300 ease-out">
                        Zjistit více
                    </IOSButton>
                </div>
            </div>
        </CommonPageTemplate>
    );
}

export default Home;