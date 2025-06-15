"use client";

import React from 'react';
import { IOSCard } from "@/components/ui/ios/card";
import { IOSButton } from "@/components/ui/ios/button";
import { IOSTextInput } from "@/components/ui/ios/text-input";
import { IOSSwitch } from "@/components/ui/ios/switch";
import { IOSSelect } from "@/components/ui/ios/select";
import { IOSTagInput } from "@/components/ui/ios/tag-input";
import { IOSTextarea } from "@/components/ui/ios/textarea";
import { Bug, Settings, AlertTriangle } from "lucide-react";

export default function TesterPage() {
    const [tags, setTags] = React.useState<string[]>([]);
    const [isEnabled, setIsEnabled] = React.useState(false);
    const [selectedOption, setSelectedOption] = React.useState("");

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Bug className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Testovací prostředí</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form Testing Card */}
                <IOSCard
                    title="Testování formulářů"
                    subtitle="Ověření funkcionality vstupních polí"
                    icon={<Settings className="w-5 h-5" />}
                    variant="elevated"
                >
                    <div className="space-y-4">
                        <IOSTextInput
                            label="Textové pole"
                            placeholder="Zadejte text..."
                        />
                        <IOSSelect
                            value={selectedOption}
                            onChange={setSelectedOption}
                            options={[
                                { value: "1", label: "Možnost 1" },
                                { value: "2", label: "Možnost 2" },
                                { value: "3", label: "Možnost 3" }
                            ]}
                            placeholder="Vyberte možnost"
                        />
                        <IOSTextarea
                            value=""
                            onChange={() => {}}
                            placeholder="Zadejte delší text..."
                        />
                        <IOSTagInput
                            tags={tags}
                            onChange={setTags}
                            label="Štítky"
                            placeholder="Přidejte štítky..."
                        />
                        <IOSSwitch
                            label="Povolit testování"
                            checked={isEnabled}
                            onChange={(e) => setIsEnabled(e.target.checked)}
                        />
                    </div>
                </IOSCard>

                {/* UI Components Card */}
                <IOSCard
                    title="Testování UI komponent"
                    subtitle="Ověření vzhledu a chování"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    variant="elevated"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <IOSButton>Primární tlačítko</IOSButton>
                            <IOSButton className="bg-gray-100 text-gray-900 hover:bg-gray-200">
                                Sekundární tlačítko
                            </IOSButton>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl text-sm text-blue-900">
                            <p className="font-medium">Testovací upozornění</p>
                            <p className="mt-1">Toto je ukázka testovacího upozornění pro ověření stylů.</p>
                        </div>
                    </div>
                </IOSCard>

                {/* Feature Testing Card */}
                <IOSCard
                    title="Testování funkcí"
                    subtitle="Ověření specifických funkcí"
                    icon={<Bug className="w-5 h-5" />}
                    variant="elevated"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h3 className="font-medium mb-2">Testovací scénáře</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Ověření validace formulářů</li>
                                <li>• Testování responzivity</li>
                                <li>• Kontrola přístupnosti</li>
                                <li>• Ověření animací</li>
                            </ul>
                        </div>
                    </div>
                </IOSCard>

                {/* Performance Testing Card */}
                <IOSCard
                    title="Testování výkonu"
                    subtitle="Měření a optimalizace"
                    icon={<Settings className="w-5 h-5" />}
                    variant="elevated"
                >
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <h3 className="font-medium mb-2">Metriky výkonu</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Čas načtení stránky</li>
                                <li>• Spotřeba paměti</li>
                                <li>• Počet HTTP požadavků</li>
                                <li>• Velikost bundle</li>
                            </ul>
                        </div>
                    </div>
                </IOSCard>
            </div>
        </div>
    );
}

