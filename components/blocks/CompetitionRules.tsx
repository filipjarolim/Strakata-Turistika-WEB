export const competitionRules = {
    title: "🏆 Strakatá turistika 2024/2025 - Pravidla soutěže",
    importantChange: "🚨 NOVINKA: Povolená je pouze chůze! Žádná kola, lodě nebo běžky.",
    sections: [
        {
            title: "📊 Bodování",
            content: [
                "🔹 Soutěž je založena na zdolaných kilometrech a navštívených místech.",
                "📍 Minimální délka trasy: 3 km + alespoň 1 bodované místo (netýká se tématu měsíce).",
                "🎯 Nejmenší počet bodů: 4 (3 za kilometry + 1 za místo).",
                "🛤️ Počet tras za den není omezen.",
                "📏 Body se udělují i za desetiny kilometru (např. 6,8 km = 6,8 bodů)."
            ]
        },
        {
            title: "📸 Důkaz o trase",
            content: [
                "📸 Každá trasa musí být doložena screenshotem nebo odkazem z aplikace (Stopař, Strava, chytré hodinky).",
                "📝 Nemáte chytrý telefon? Pošlete podrobný itinerář s fotkami rozcestníků, přístřešků či jiných orientačních bodů."
            ]
        },
        {
            title: "📷 Bonusové fotky",
            content: [
                "📷 Pošlete fotky hezkých míst s označením 'FOTO Z TRASY' – mohou být součástí kalendáře!"
            ]
        },
        {
            title: "🔄 Opakované trasy",
            content: [
                "🔁 Pokud trasu jdete znovu, musíte ji pozměnit (delší, kratší, přidaná cesta apod.)."
            ]
        },
        {
            title: "📅 Termíny a podmínky",
            content: [
                "🗓️ Soutěž trvá od 1. 11. 2024 do 31. 10. 2025.",
                "⏳ Fotky musí být nahrány do 14 dnů od pořízení, nejpozději do 31. 10. 2025 24:00!"
            ]
        }
    ]
};

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Image as ImageIcon } from "lucide-react";

const CompetitionRules = () => {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 bg-gray-100 rounded-lg shadow-lg">
            <Card className="border border-red-500 bg-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2 text-lg font-bold">
                        <AlertTriangle size={20} /> {competitionRules.importantChange}
                    </CardTitle>
                </CardHeader>
            </Card>

            <Tabs defaultValue={competitionRules.sections[0].title} className="w-full">
                <TabsList className="flex overflow-x-auto bg-gray-200 p-2 rounded-lg">
                    {competitionRules.sections.map((section, index) => (
                        <TabsTrigger key={index} value={section.title} className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-300 focus:bg-gray-400">
                            {section.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {competitionRules.sections.map((section, index) => (
                    <TabsContent key={index} value={section.title} className="p-4 bg-white rounded-lg shadow-sm">
                        <ul className="space-y-3 text-gray-700">
                            {section.content.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default CompetitionRules;
