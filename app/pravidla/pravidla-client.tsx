'use client';

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import Image from "next/image";
import {
    MapPin,
    Camera,
    Shield,
    AlertTriangle,
    CheckCircle,
    Info,
    FileText,
    Download,
    Award,
    ExternalLink,
    ChevronRight,
    Search,
    Loader2,
    Mountain,
    Eye,
    TreeDeciduous,
    Castle,
    Sparkles,
    Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IOSButton } from "@/components/ui/ios/button";
import Link from "next/link";

interface ScoringConfig {
    pointsPerKm: number;
    minDistanceKm: number;
    requireAtLeastOnePlace: boolean;
}

interface PlaceTypeConfig {
    id: string;
    name: string;
    label: string;
    icon: string;
    points: number;
    color: string;
    isActive: boolean;
}

const ICON_MAP: Record<string, any> = {
    Mountain: Mountain,
    Eye: Eye,
    TreeDeciduous: TreeDeciduous,
    Castle: Castle,
    Sparkles: Sparkles,
    MapPin: MapPin,
    terrain: Mountain,
    attractions: Eye,
    park: TreeDeciduous,
    castle: Castle,
    star: Sparkles,
    place: MapPin
};

// --- Components ---

interface RuleItem {
    title: string;
    content: string;
    important: boolean;
    icon: React.ReactNode;
}

const RuleCard = ({ rule, index }: { rule: RuleItem, index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
        >
            <div className={cn(
                "h-full p-5 rounded-3xl border transition-all duration-300",
                "bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-xl hover:shadow-blue-900/5",
                "border-gray-100 dark:border-gray-800"
            )}>
                <div className="flex items-start gap-4">
                    <div className={cn(
                        "p-3 rounded-2xl shrink-0 transition-colors",
                        rule.important ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600",
                        "group-hover:scale-110 duration-300"
                    )}>
                        {rule.important ? <AlertTriangle size={20} /> : rule.icon}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-gray-900 leading-tight">
                                {rule.title}
                            </h4>
                            {rule.important && (
                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    Důležité
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                            {rule.content}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const Section = ({ title, subtitle, icon, color, bgColor, image, description, rules, index }: {
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    color: string,
    bgColor: string,
    image: string,
    description: string,
    rules: RuleItem[],
    index: number
}) => {
    const isEven = index % 2 === 0;

    return (
        <section className="py-24 relative">
            {/* Background Decor */}
            <div className={cn(
                "absolute top-1/2 -translate-y-1/2 w-[120%] h-[80%] rounded-full blur-[100px] opacity-30 -z-10",
                isEven ? "right-[-20%] bg-blue-200/50" : "left-[-20%] bg-green-200/50"
            )} />

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                {/* Image Side */}
                <motion.div
                    className={cn(
                        "relative group perspective-1000",
                        isEven ? "lg:order-2" : "lg:order-1"
                    )}
                    initial={{ opacity: 0, scale: 0.95, rotate: isEven ? 2 : -2 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-[3rem] overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-cover"
                            priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                        {/* Floating Badge */}
                        <div className={cn(
                            "absolute bottom-8 left-8 right-8 glass-panel p-6 rounded-3xl backdrop-blur-xl border border-white/20 bg-white/20 text-white",
                            "transform transition-all duration-500 group-hover:-translate-y-2"
                        )}>
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl bg-white/20", color.replace('text-', 'text-white '))} >
                                    {icon}
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm font-medium uppercase tracking-wider">{subtitle}</p>
                                    <h3 className="text-2xl font-bold text-white">{title}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content Side */}
                <div className={cn(
                    "space-y-8",
                    isEven ? "lg:order-1" : "lg:order-2"
                )}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
                            {title}
                        </h2>
                        <p className="text-xl text-gray-600 leading-relaxed font-medium">
                            {description}
                        </p>
                    </motion.div>

                    <div className="grid gap-4">
                        {rules.map((rule, i) => (
                            <RuleCard key={i} rule={rule} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const QuickLinks = () => {
    const quickLinks = [
        {
            title: "Průběžné pořadí",
            description: "Jak si vedeme?",
            icon: <Award className="h-5 w-5" />,
            color: "text-emerald-600 bg-emerald-50",
            arrowColor: "text-emerald-300 group-hover:text-emerald-600",
            href: "/soutez/poradi"
        },
        {
            title: "Fotogalerie",
            description: "Inspirace",
            icon: <Camera className="h-5 w-5" />,
            color: "text-purple-600 bg-purple-50",
            arrowColor: "text-purple-300 group-hover:text-purple-600",
            href: "/galerie"
        }
    ];

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {quickLinks.map((link, i) => (
                <Link key={i} href={link.href}>
                    <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative flex items-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 h-full"
                    >
                        <div className={cn("p-4 rounded-2xl mr-5 transition-colors", link.color)}>
                            {link.icon}
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{link.title}</h3>
                            <p className="text-gray-500 text-sm">{link.description}</p>
                        </div>
                        <ChevronRight className={cn("h-6 w-6 transition-colors", link.arrowColor)} />
                    </motion.div>
                </Link>
            ))}
        </div>
    );
};

export function PravidlaClient() {
    const [config, setConfig] = useState<ScoringConfig | null>(null);
    const [placeTypes, setPlaceTypes] = useState<PlaceTypeConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [configRes, typesRes] = await Promise.all([
                    fetch('/api/scoring-config'),
                    fetch('/api/place-type-configs')
                ]);
                if (configRes.ok && typesRes.ok) {
                    setConfig(await configRes.json());
                    setPlaceTypes(await typesRes.json());
                }
            } catch (error) {
                console.error("Failed to fetch rules data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleDownloadRules = () => {
        const activePlaceTypesText = placeTypes
            .filter(t => t.isActive)
            .map(t => `- ${t.label}: ${t.points} bod${t.points === 1 ? '' : t.points >= 2 && t.points <= 4 ? 'y' : 'ů'}`)
            .join('\n');

        const rulesContent = `PRAVIDLA STRAKATÉ TURISTIKY 2025/2026

ZÁKLADNÍ PRAVIDLA SOUTĚŽE:
- Letos je povolena pouze chůze, žádný dopravní prostředek (kolo, loď, běžky)
- Trasa musí měřit nejméně ${config?.minDistanceKm || '3'} km
- Za každý kilometr získáte ${config?.pointsPerKm || '1'} bod
- ${config?.requireAtLeastOnePlace ? 'Na trase musíte navštívit alespoň 1 bodované místo' : 'Není nutné navštívit bodované místo, ale doporučujeme to!'}
- Body se dávají i za desetiny kilometru
- Počet tras ušlých za jeden den není nijak omezen

BODOVANÁ MÍSTA:
${activePlaceTypesText}

DŮKAZ UŠLÝCH KILOMETRŮ:
- Screen nebo odkaz z aplikace (stopař, strava apod.)
- Fotky z bodovaných míst
- Pro ty bez chytrého telefonu: podrobný itinerář + fotky z trasy

VÝJIMKY:
- Pro seniory a handicapované: možnost požádat o výjimku pro trasu minimálně 1,5 km
- O výjimku musíte požádat a zdůvodnit ji

BODOVÁNÍ A POŘADÍ:
- Při rovnosti bodů rozhoduje: 1) počet ušlých kilometrů, 2) počet bodů za navštívená místa
- Soutěž je pro členy Spolku českého strakatého psa
- Bodovací období: 1. 11. 2025 do 31. 10. 2026
- Fotka nesmí být starší 14 dní od pořízení

BODOVANÁ MÍSTA (DETAILY):
- Fotka přímo z bodovaného místa (ne z dálky)
- Bodované místo můžete navštívit za rok kolikrát chcete, ale body budete mít jen jednou
- Vícebodová místa: napište všechny získané body

TÉMA MĚSÍCE:
- Tři slova vztahující se k tématu měsíce
- Není podmínka trasy 3 km
- Bonus 5 bodů za splnění tématu
- Aktuální téma najdete v aktualitách

POŽADAVKY NA FOTKY:
- Jméno majitele + psa (oficiální i volací)
- Datum
- Název místa
- Pojmenujte fotku podle místa pořízení

Kontakt: info@strakataturistika.cz`;

        const blob = new Blob([rulesContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pravidla-strakate-turistiky-2025-26.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-40 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="text-gray-500 font-medium">Načítání pravidel...</p>
            </div>
        );
    }

    const rulesHowTo = [
        {
            title: "Pouze po svých",
            content: "Žádná kola, lodě ani běžky. Uznáváme pouze pěší turistiku. Jen vy a váš pes v přírodě.",
            important: true,
            icon: <MapPin className="h-5 w-5" />
        },
        {
            title: `Minimálně ${config?.minDistanceKm || 3} km`,
            content: `Každý výlet musí mít délku alespoň ${config?.minDistanceKm || 3} km. Kratší procházky se do soutěže nepočítají.`,
            important: true,
            icon: <Search className="h-5 w-5" />
        },
        {
            title: "Bodování trasy",
            content: `Za každý ušlý kilometr získáte ${config?.pointsPerKm || 1} bod. ${config?.requireAtLeastOnePlace ? 'Nezapomeňte navštívit alespoň jedno bodované místo.' : ''}`,
            important: false,
            icon: <Award className="h-5 w-5" />
        }
    ];

    const rulesChallenges = placeTypes.filter(t => t.isActive).map(t => ({
        title: t.label,
        content: `Navštivte toto místo a získejte ${t.points} bod${t.points === 1 ? '' : t.points >= 2 && t.points <= 4 ? 'y' : 'ů'}.`,
        important: false,
        icon: React.createElement(ICON_MAP[t.icon] || Mountain, { size: 20 })
    }));

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 overflow-hidden selection:bg-blue-100 selection:text-blue-900">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="pt-24 pb-16 md:pt-32 md:pb-24 text-center max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100 mb-8 animate-fade-in-up">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-gray-600">Sezóna 2025 / 2026</span>
                    </div>

                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.9]">
                        Pravidla
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                            Strakaté turistiky
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        Vše, co potřebuješ vědět. Přehledně, jasně a s láskou k pohybu.
                    </p>

                    <div className="mt-12 flex flex-wrap justify-center gap-4">
                        <IOSButton
                            onClick={handleDownloadRules}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 h-14 px-8 rounded-2xl flex items-center gap-3 animate-fade-in-up shadow-xl shadow-black/10"
                        >
                            <Download className="w-5 h-5" /> Stáhnout kompletní pravidla (TXT)
                        </IOSButton>
                    </div>
                </motion.div>

                {/* Main Content Sections */}
                <div className="space-y-12">
                    <Section
                        title="Jak na to?"
                        subtitle="Základní principy"
                        icon={<MapPin className="h-6 w-6" />}
                        color="text-blue-500"
                        bgColor="bg-blue-500/10"
                        image="/img/mascot/hiking.png"
                        description="Účast v soutěži je snadná. Stačí vzít svého strakáče, vyrazit do přírody a dodržet pár jednoduchých pravidel."
                        rules={rulesHowTo}
                        index={0}
                    />
                    <Section
                        title="Bodovaná místa"
                        subtitle="Kde sbírat body"
                        icon={<Camera className="h-6 w-6" />}
                        color="text-emerald-500"
                        bgColor="bg-emerald-500/10"
                        image="/img/mascot/photography.png"
                        description="Objevujte nová místa a získávejte body. Každý rok můžete navštívit stovky zajímavých lokalit."
                        rules={rulesChallenges.slice(0, 3)} // Show first 3 in main layout
                        index={1}
                    />

                    {/* More Details section */}
                    <Section
                        title="Důležité info"
                        subtitle="Na co nezapomenout"
                        icon={<Shield className="h-6 w-6" />}
                        color="text-amber-500"
                        bgColor="bg-amber-500/10"
                        image="/img/mascot/reading.png"
                        description="Pár formalit, které je třeba dodržet, aby byly vaše body spravedlivě uznány."
                        rules={[
                            {
                                title: "14 dní na odeslání",
                                content: "Fotky a záznamy posílejte včas. Maximálně do 14 dnů od výletu, později to nejde.",
                                important: true,
                                icon: <AlertTriangle className="h-5 w-5" />
                            },
                            {
                                title: "Členství ve spolku",
                                content: "Soutěž je exkluzivní pro členy Spolku českého strakatého psa.",
                                important: true,
                                icon: <Shield className="h-5 w-5" />
                            }
                        ]}
                        index={2}
                    />
                </div>

                {/* Footer Actions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-32 space-y-16"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Rychlá navigace</h2>
                        <p className="text-gray-500">Kam dál?</p>
                    </div>

                    <QuickLinks />
                </motion.div>

            </div>
        </div>
    );
}