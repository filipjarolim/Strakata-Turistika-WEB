"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
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
    ChevronRight,
    ChevronDown,
    ExternalLink,
    Download,
    Eye,
    Search,
    Filter,
    Bookmark,
    Share2,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";

// iOS Components
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSSection } from "@/components/ui/ios/section";
import { IOSBadge } from "@/components/ui/ios/badge";
import { IOSCircleIcon } from "@/components/ui/ios/circle-icon";
import { IOSDropdownMenu, IOSDropdownMenuItem } from "@/components/ui/ios/dropdown-menu";

// Rules data
const RULES_SECTIONS = [
    {
        id: "general",
        title: "Obecná pravidla",
        icon: <Shield className="h-5 w-5" />,
        color: "bg-blue-100 text-blue-600",
        rules: [
            {
                title: "Členství ve spolku",
                content: "Členem spolku se může stát každý, kdo souhlasí s cíli spolku a má zájem o českého strakatého psa. Přihláška se podává písemně na adresu spolku.",
                important: true
            },
            {
                title: "Povinnosti členů",
                content: "Členové jsou povinni dodržovat stanovy spolku, platit členské příspěvky včas a aktivně se podílet na činnosti spolku.",
                important: false
            },
            {
                title: "Práva členů",
                content: "Členové mají právo účastnit se všech akcí spolku, volit a být voleni do orgánů spolku, a využívat všech služeb spolku.",
                important: false
            }
        ]
    },
    {
        id: "competitions",
        title: "Soutěže a závody",
        icon: <Award className="h-5 w-5" />,
        color: "bg-green-100 text-green-600",
        rules: [
            {
                title: "Podmínky účasti",
                content: "Soutěží se mohou zúčastnit pouze členové spolku s platným členstvím. Pes musí být zdravý a mít platné očkování.",
                important: true
            },
            {
                title: "Přihlášky",
                content: "Přihlášky na soutěže se podávají nejpozději 7 dní před konáním akce. Pozdní přihlášky nebudou akceptovány.",
                important: false
            },
            {
                title: "Bezpečnost",
                content: "Účastníci jsou povinni dodržovat bezpečnostní pravidla a pokyny pořadatelů. Agresivní psi budou ze soutěže vyloučeni.",
                important: true
            }
        ]
    },
    {
        id: "events",
        title: "Akce a výlety",
        icon: <Calendar className="h-5 w-5" />,
        color: "bg-purple-100 text-purple-600",
        rules: [
            {
                title: "Registrace na akce",
                content: "Na všechny akce je nutná předchozí registrace. Počet účastníků může být omezen kapacitou.",
                important: false
            },
            {
                title: "Vybavení",
                content: "Účastníci si přinášejí vlastní vybavení pro psa (vodítko, misku, krmivo). Spolek zajišťuje pouze základní vybavení.",
                important: false
            },
            {
                title: "Zrušení akce",
                content: "V případě nepříznivého počasí nebo jiných okolností může být akce zrušena. Informace budou sděleny nejpozději den předem.",
                important: true
            }
        ]
    },
    {
        id: "safety",
        title: "Bezpečnost a zdraví",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "bg-red-100 text-red-600",
        rules: [
            {
                title: "Zdravotní stav psa",
                content: "Pes musí být zdravý a nemít příznaky infekčních onemocnění. V případě pochybností se poraďte s veterinářem.",
                important: true
            },
            {
                title: "Očkování",
                content: "Pes musí mít platné očkování proti vzteklině a dalším základním onemocněním. Očkovací průkaz je nutné mít s sebou.",
                important: true
            },
            {
                title: "První pomoc",
                content: "Na všech akcích je k dispozici základní lékárnička. V případě úrazu kontaktujte ihned pořadatele.",
                important: false
            }
        ]
    }
];

const RuleCard = ({ rule, index }: { rule: { title: string; content: string; important: boolean }; index: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <IOSCard
                variant="outlined"
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <IOSCircleIcon 
                            variant={rule.important ? "red" : "default"} 
                            size="sm"
                        >
                            {rule.important ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </IOSCircleIcon>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
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
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-gray-600 text-sm leading-relaxed"
                                    >
                                        {rule.content}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <ChevronDown 
                        className={cn(
                            "h-5 w-5 text-gray-400 transition-transform duration-200 mt-1",
                            isExpanded && "rotate-180"
                        )} 
                    />
                </div>
            </IOSCard>
        </motion.div>
    );
};

const QuickLinks = () => {
    const quickLinks = [
        {
            title: "Stanovy spolku",
            description: "Oficiální dokumenty spolku",
            icon: <FileText className="h-5 w-5" />,
            color: "bg-blue-100 text-blue-600",
            action: "Stáhnout PDF"
        },
        {
            title: "Přihláška člena",
            description: "Formulář pro nové členy",
            icon: <Users className="h-5 w-5" />,
            color: "bg-green-100 text-green-600",
            action: "Vyplnit online"
        },
        {
            title: "Kalendář akcí",
            description: "Přehled všech akcí",
            icon: <Calendar className="h-5 w-5" />,
            color: "bg-purple-100 text-purple-600",
            action: "Zobrazit"
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
                    Máte dotazy k pravidlům nebo potřebujete pomoct s přihláškou? 
                    Neváhejte nás kontaktovat.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <IOSButton variant="primary" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Kontaktovat
                    </IOSButton>
                    <IOSButton variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Stáhnout pravidla
                    </IOSButton>
                </div>
            </div>
        </IOSCard>
    );
};

export default function PravidlaPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSection, setSelectedSection] = useState("all");

    // Filter rules based on search
    const filteredSections = RULES_SECTIONS.map(section => ({
        ...section,
        rules: section.rules.filter(rule =>
            rule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(section => 
        selectedSection === "all" || section.id === selectedSection
    ).filter(section => section.rules.length > 0);

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
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Pravidla a předpisy</h1>
                    <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
                        Seznamte se s pravidly spolku českého strakatého psa a podmínkami účasti na našich akcích.
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

            {/* Search and Filter */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
            >
                <IOSCard
                    title="Vyhledávání v pravidlech"
                    subtitle={`Nalezeno ${filteredSections.reduce((acc, section) => acc + section.rules.length, 0)} pravidel`}
                    icon={<Search className="h-6 w-6" />}
                    iconBackground="bg-blue-100"
                    iconColor="text-blue-600"
                >
                    <div className="space-y-6">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <IOSTextInput
                                placeholder="Hledat v pravidlech..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Section Filter */}
                        <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Sekce</h4>
                            <div className="flex flex-wrap gap-2">
                                <IOSButton
                                    variant={selectedSection === "all" ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedSection("all")}
                                >
                                    Všechny sekce
                                </IOSButton>
                                {RULES_SECTIONS.map((section) => (
                                    <IOSButton
                                        key={section.id}
                                        variant={selectedSection === section.id ? "primary" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedSection(section.id)}
                                        className="gap-2"
                                    >
                                        {section.icon}
                                        {section.title}
                                    </IOSButton>
                                ))}
                            </div>
                        </div>
                    </div>
                </IOSCard>
            </motion.div>

            {/* Rules Sections */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="space-y-8"
            >
                {filteredSections.length === 0 ? (
                    <IOSCard
                        title="Žádná pravidla nenalezena"
                        subtitle={searchTerm 
                            ? `Nepodařilo se najít žádná pravidla odpovídající "${searchTerm}"`
                            : "V této sekci zatím nejsou žádná pravidla"}
                        icon={<BookOpen className="h-6 w-6" />}
                        iconBackground="bg-gray-100"
                        iconColor="text-gray-400"
                    >
                        <div className="text-center py-8">
                            <IOSCircleIcon variant="default" size="lg" className="mx-auto mb-4">
                                <BookOpen className="h-8 w-8" />
                            </IOSCircleIcon>
                            {searchTerm && (
                                <IOSButton
                                    variant="outline"
                                    onClick={() => setSearchTerm("")}
                                    className="mt-4"
                                >
                                    Vymazat vyhledávání
                                </IOSButton>
                            )}
                        </div>
                    </IOSCard>
                ) : (
                    filteredSections.map((section, sectionIndex) => (
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
                    ))
                )}
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
