'use client';

import React from 'react';
import { motion } from "framer-motion";
import { 
    BookOpen, 
    FileText, 
    Shield, 
    Users, 
    Award, 
    Calendar, 
    MapPin, 
    Clock, 
    AlertTriangle, 
    CheckCircle, 
    ExternalLink,
    Download,
    Eye,
    Search,
    Filter,
    Bookmark,
    Share2,
    Info,
    Camera
} from "lucide-react";
import { cn } from "@/lib/utils";

// iOS Components
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";

// Rules data
const RULES_SECTIONS = [
    {
        id: "general",
        title: "Základní pravidla soutěže",
        icon: <Shield className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-600",
        rules: [
            {
                title: "Pozor změna oproti minulému ročníku",
                content: "Letos je povolena pouze chůze, žádný dopravní prostředek (kolo, loď, běžky). V letošním roce budou základem soutěže zdolané kilometry + navštívená místa.",
                important: true
            },
            {
                title: "Minimální délka trasy",
                content: "Trasa musí měřit nejméně 3 km (poznámka: nevztahuje se na téma měsíce). Na trase musíte navštívit alespoň 1 bodované místo. Nejmenší počet bodů, které můžete získat je 4 - 3 za kilometry + 1 za bodované místo.",
                important: true
            },
            {
                title: "Počet tras za den",
                content: "Počet tras ušlých za jeden den není nijak omezen.",
                important: false
            },
            {
                title: "Bodování kilometrů",
                content: "Body se dávají i za desetiny kilometru - trasa 6,8 km znamená 6,8 bodů.",
                important: false
            },
            {
                title: "Důkaz ušlých kilometrů",
                content: "Jako důkaz ušlých km budete posílat screen nebo odkaz z aplikace, z mobilu - stopař, strava apod. nebo z chytrých hodinek. Dále budete posílat fotky z bodovaných míst. Pokud by byl někdo, kdo nemá chytrý telefon ani chytré hodinky, tak pošle podrobně popsaný itinerář a jako důkaz fotky z trasy např. rozcestí, turistický přístřešek, parkoviště apod.",
                important: true
            },
            {
                title: "Fotky z trasy",
                content: "Protože se letos bodují i ušlé kilometry, tak pokud na trase narazíte na místo, které se neboduje, ale je hezké (např. zřícenina hradu, potůček, výhled do kraje atd.) a váš pes hezky zapózuje a budete tak mít povedenou fotku, tak ji určitě pošlete s textem \"Foto z trasy\" - ať máme z čeho vybírat do kalendáře :-)",
                important: false
            },
            {
                title: "Opakované návštěvy míst",
                content: "Pokud půjdete trasu, na které se nachází více bodovaných míst, tak je možné si body \"pošetřit\" - tzn. že neseberete všechny body hned napoprvé, ale pokud půjdete víckrát, tak nikdy nesmí být trasa úplně stejná - musí tam být změna - delší, zkrácená, přidaná cesta apod.",
                important: false
            },
            {
                title: "Dogtrekking a canicross",
                content: "V případě, že se zúčastníte dogtrekingu, canicrossu či jiného závodu a po cestě navštívíte bodovaná místa, tak je možné body do ST použít, ale už nebudete moct bodovat s tím samým závodem v pracovním strakáči.",
                important: false
            }
        ]
    },
    {
        id: "exceptions",
        title: "Výjimky",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "bg-amber-100 text-amber-600",
        rules: [
            {
                title: "Výjimka pro seniory a handicapované",
                content: "Pro psí (i lidské) seniory, psy (i lidi) v rekonvalescenci, psy (i lidi) s handicapem apod. je v odůvodněných případech možné udělit výjimku. Pokud máte psa staršího 12 let, po nemoci, úrazu, v rekonvalescenci, s handicapem, nebo pokud sám jste po nemoci, úrazu, v rekonvalescenci, s handicapem, tak máte možnost požádat o výjimku, která vám umožní sbírat body po ujítí trasy minimálně 1,5 km.",
                important: true
            },
            {
                title: "Žádost o výjimku",
                content: "O výjimku musíte požádat a zdůvodnit ji. Udělení výjimky není automatické, důvod musí být opodstatněný (že měl člověk chřipku, opravdu není ten správný důvod :-)).",
                important: true
            }
        ]
    },
    {
        id: "scoring",
        title: "Bodování a pořadí",
        icon: <Award className="h-5 w-5" />,
        color: "bg-green-100 text-green-600",
        rules: [
            {
                title: "Rozhodování při rovnosti bodů",
                content: "Při rovnosti bodů za celé bodovací období rozhoduje: 1) počet ušlých kilometrů, 2) počet bodů za navštívená místa.",
                important: true
            },
            {
                title: "Úprava pravidel",
                content: "Organizátoři si vyhrazují právo na úpravu pravidel v průběhu soutěže. Neděláme to rádi, ale někdy v průběhu roku nastane neočekávaná situace a my na ni musíme zareagovat.",
                important: false
            },
            {
                title: "Členství",
                content: "Soutěž je pro členy Spolku českého strakatého psa.",
                important: true
            },
            {
                title: "Bodovací období",
                content: "Bodovací období je pro letošní ročník od 1. 11. 2024 do 31. 10. 2025.",
                important: true
            },
            {
                title: "Termín pro zasílání fotek",
                content: "Pro zasílání fotek používejte nejlépe formulář zde na stránce a fotka nesmí být starší 14 dní, max. 14 dní od pořízení, jinak nemusí být uznána! Konec ročníku 2025 je 31. 10. 2025 - tzn. že poslední termín pro zaslání fotky je nejdéle do 31. 10. 2025 24:00 hod.!",
                important: true
            }
        ]
    },
    {
        id: "places",
        title: "Bodovaná místa",
        icon: <MapPin className="h-5 w-5" />,
        color: "bg-purple-100 text-purple-600",
        rules: [
            {
                title: "Fotky z bodovaných míst",
                content: "V letošním roce budeme striktně vyžadovat fotku přímo z bodovaného místa. Nebudou se tedy uznávat fotky, kde je např. hora krásně vyfocená v dálce a strakáč pózuje někde na úpatí na louce. Prostě budou uznané jen přímé důkazy o návštěvě místa.",
                important: true
            },
            {
                title: "Nedostupnost míst",
                content: "Může se stát, že bodované místo bude nedostupné a tudíž se nemůže uznat. Není v našich silách zkontrolovat přístupnost všech bodů, je tedy potřeba si předem doma projít mapu a zkontrolovat místa, abyste se nevydali na výšlap a až na místě zjistili, že se objekt nachází např. v klidové zóně NP a není tam vstup povolen.",
                important: true
            },
            {
                title: "Opakované návštěvy",
                content: "Bodované místo můžete navštívit za rok kolikrát chcete, ale body budete mít jen jednou - kromě sekce Strakáč zve - tam jsou vlastní upravená pravidla.",
                important: false
            },
            {
                title: "Vícebodová místa",
                content: "V letošním ročníku jsou místa, kde můžete získat najednou více bodů, v tom případě musíte při posílání bodů napsat všechny získané body - není v našich silách tohle za vás kontrolovat.",
                important: true
            }
        ]
    },
    {
        id: "monthly-theme",
        title: "Téma měsíce",
        icon: <Calendar className="h-5 w-5" />,
        color: "bg-pink-100 text-pink-600",
        rules: [
            {
                title: "Princip tématu měsíce",
                content: "Na každý měsíc budou vybrána tři slova, která se vztahují k pohádkám. Vaším úkolem bude najít na mapy.cz místo, které se k těmto slovům vztahuje. Uznávají se slova odvozená, příbuzná atd. (např. Kašpárek - Kašparova chata, vrchol Kašparka apod.).",
                important: false
            },
            {
                title: "Výjimka pro téma měsíce",
                content: "Pozor! Pouze v kategorii téma měsíce není podmínka trasy 3 km, můžete poslat jen fotku, jak váš strakáč sedí před domem s pamětní deskou Jana Kašpara a v tom případě dostanete jen 1 bod. Pokud si k tomu uděláte ještě procházku, tak máte body za ušlé kilometry + 1 za kašpárka.",
                important: true
            },
            {
                title: "Bonus za všechna slova",
                content: "Když se vám podaří v měsíci posbírat všechna tři slova, budete mít bonusové 2 body.",
                important: false
            },
            {
                title: "Označení slov",
                content: "Je nutné, abyste k fotce sami psali, zda je to nalezené první, druhé nebo třetí slovo. Jedno slovo se boduje jen jednou.",
                important: true
            },
            {
                title: "Aktuální téma",
                content: "červenec: Král - Koruna - Hrad",
                important: false
            }
        ]
    },
    {
        id: "photo-requirements",
        title: "Požadavky na fotky",
        icon: <Camera className="h-5 w-5" />,
        color: "bg-indigo-100 text-indigo-600",
        rules: [
            {
                title: "Informace k fotce",
                content: "K fotce je potřeba doplnit: Jméno majitele + psa (oficiální i volací), datum, název místa - (pokud je to místo \"vícebodové\" viz příklad bodování výše, tak prosím napište všechny možnosti).",
                important: true
            },
            {
                title: "Pojmenování fotek",
                content: "A ještě prosba: hodně nám pomůže, když fotku, kterou nahráváte pojmenujete podle místa, kde byla pořízená. Někteří z vás to tak dělají a pro uložení a zapsání bodů je to velká pomoc. Díky :-)",
                important: false
            },
            {
                title: "Souhlas se zveřejněním",
                content: "Soutěžící účastí v soutěži souhlasí se zveřejněním fotek se svým jménem na veřejné sociální síti Rajce.net.",
                important: false
            }
        ]
    }
];

const RuleCard = ({ rule, index }: { rule: { title: string; content: string; important: boolean }; index: number }) => {
  return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <IOSCard
                variant="outlined"
                className="hover:shadow-lg transition-all duration-200"
            >
                <div className="flex items-start gap-3">
                    <IOSCircleIcon 
                        variant={rule.important ? "red" : "default"} 
                        size="sm"
                    >
                        {rule.important ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </IOSCircleIcon>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-semibold text-gray-900">{rule.title}</h4>
                            {rule.important && (
                                <IOSBadge
                                    label="Důležité"
                                    bgColor="bg-red-100"
                                    textColor="text-red-800"
                                    size="sm"
                                />
                            )}
                        </div>
                        <div className="text-gray-600 text-sm leading-relaxed">
                            {rule.content}
                        </div>
                    </div>
                </div>
            </IOSCard>
        </motion.div>
    );
};

const QuickLinks = () => {
    const quickLinks = [
        {
            title: "Seznam bodovaných míst",
            description: "Kompletní seznam všech bodovaných míst",
            icon: <MapPin className="h-5 w-5" />,
            color: "bg-blue-100 text-blue-600",
            action: "Zobrazit seznam"
        },
        {
            title: "Průběžné pořadí",
            description: "Aktuální pořadí soutěžících",
            icon: <Award className="h-5 w-5" />,
            color: "bg-green-100 text-green-600",
            action: "Zobrazit pořadí"
        },
        {
            title: "Fotogalerie",
            description: "Fotky z předchozích ročníků",
            icon: <Camera className="h-5 w-5" />,
            color: "bg-purple-100 text-purple-600",
            action: "Prohlížet"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => (
                <motion.div
                    key={link.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                >
                    <IOSCard
                        title={link.title}
                        subtitle={link.description}
                        icon={link.icon}
                        iconBackground={link.color.split(' ')[0]}
                        iconColor={link.color.split(' ')[1]}
                        className="cursor-pointer hover:shadow-xl transition-all duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <IOSButton variant="outline" size="sm" className="gap-2">
                                {link.action}
                                <ExternalLink className="h-4 w-4" />
                            </IOSButton>
                        </div>
                    </IOSCard>
                </motion.div>
            ))}
        </div>
    );
};

const ContactInfo = () => {
    const handleContact = () => {
        window.location.href = 'mailto:info@strakataturistika.cz?subject=Dotaz k pravidlům Strakaté turistiky';
    };

    const handleDownloadRules = () => {
        // Create a text file with the rules content
        const rulesContent = `PRAVIDLA STRAKATÉ TURISTIKY 2024/2025

ZÁKLADNÍ PRAVIDLA SOUTĚŽE:
- Letos je povolena pouze chůze, žádný dopravní prostředek (kolo, loď, běžky)
- Trasa musí měřit nejméně 3 km (nevztahuje se na téma měsíce)
- Na trase musíte navštívit alespoň 1 bodované místo
- Body se dávají i za desetiny kilometru
- Počet tras ušlých za jeden den není nijak omezen

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
- Bodovací období: 1. 11. 2024 do 31. 10. 2025
- Fotka nesmí být starší 14 dní od pořízení

BODOVANÁ MÍSTA:
- Fotka přímo z bodovaného místa (ne z dálky)
- Bodované místo můžete navštívit za rok kolikrát chcete, ale body budete mít jen jednou
- Vícebodová místa: napište všechny získané body

TÉMA MĚSÍCE:
- Tři slova vztahující se k pohádkám
- Není podmínka trasy 3 km
- Bonus 2 body za všechna tři slova v měsíci
- Aktuální téma: Král - Koruna - Hrad

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
        link.download = 'pravidla-strakate-turistiky.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    return (
        <IOSCard
            title="Potřebujete pomoct?"
            subtitle="Kontaktujte nás pro další informace"
            icon={<Info className="h-6 w-6" />}
            iconBackground="bg-amber-100"
            iconColor="text-amber-600"
        >
            <div className="space-y-4">
                <p className="text-gray-600">
                    Máte dotazy k pravidlům soutěže nebo potřebujete pomoct s nahráváním fotek? 
                    Neváhejte nás kontaktovat na info@strakataturistika.cz
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <IOSButton 
                        variant="primary" 
                        className="gap-2"
                        onClick={handleContact}
                    >
                        <FileText className="h-4 w-4" />
                        Kontaktovat
                    </IOSButton>
                    <IOSButton 
                        variant="outline" 
                        className="gap-2"
                        onClick={handleDownloadRules}
                    >
                        <Download className="h-4 w-4" />
                        Stáhnout pravidla
                    </IOSButton>
                </div>
      </div>
        </IOSCard>
    );
};

export function PravidlaClient() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <motion.div 
                className="text-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="flex items-center justify-center gap-3">
                    <IOSCircleIcon variant="blue" size="lg">
                        <BookOpen className="h-8 w-8" />
                    </IOSCircleIcon>
                </div>
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Pravidla Strakaté turistiky</h1>
                    <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
                        Seznamte se s pravidly soutěže Strakatá turistika pro členy Spolku českého strakatého psa.
                    </p>
                </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <IOSSection title="Rychlé odkazy">
                    <QuickLinks />
                </IOSSection>
            </motion.div>

            {/* Rules Sections */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-8"
            >
                {RULES_SECTIONS.map((section, sectionIndex) => (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + sectionIndex * 0.1, duration: 0.6 }}
                    >
                        <IOSSection 
                            title={section.title}
                            subtitle={`${section.rules.length} pravidel`}
                        >
                            <div className="space-y-4">
                                {section.rules.map((rule, ruleIndex) => (
                                    <RuleCard 
                                        key={rule.title} 
                                        rule={rule} 
                                        index={ruleIndex} 
                                    />
                                ))}
                            </div>
                        </IOSSection>
                    </motion.div>
                ))}
            </motion.div>

            {/* Contact Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
            >
                <ContactInfo />
            </motion.div>
        </div>
    );
} 