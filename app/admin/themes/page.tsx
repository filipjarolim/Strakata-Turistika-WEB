'use client';

import { RoleGate } from "@/components/auth/role-gate";
import CommonPageTemplate from "@/components/structure/CommonPageTemplate";
import { UserRole } from "@prisma/client";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Save, Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface MonthlyTheme {
    id: string;
    year: number;
    month: number;
    keywords: string[];
}

const MONTHS = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

const AdminThemesPage = () => {
    const user = useCurrentUser();
    const role = useCurrentRole();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [themes, setThemes] = useState<MonthlyTheme[]>([]);

    // New theme state
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
    const [keywords, setKeywords] = useState<string[]>(["", "", ""]);

    const fetchThemes = async () => {
        try {
            const response = await fetch('/api/admin/themes');
            if (response.ok) {
                const data = await response.json();
                setThemes(data);
            }
        } catch (error) {
            console.error("Failed to fetch themes:", error);
        }
    };

    useEffect(() => {
        fetchThemes();
    }, []);

    const handleKeywordChange = (index: number, value: string) => {
        const newKeywords = [...keywords];
        newKeywords[index] = value;
        setKeywords(newKeywords);
    };

    const handleSave = () => {
        if (keywords.some(k => !k.trim())) {
            toast({
                title: "Chyba",
                description: "Vyplňte prosím všechna 3 klíčová slova.",
                variant: "destructive"
            });
            return;
        }

        startTransition(async () => {
            try {
                const response = await fetch('/api/admin/themes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        year: parseInt(selectedYear),
                        month: parseInt(selectedMonth),
                        keywords: keywords.map(k => k.trim())
                    })
                });

                if (response.ok) {
                    toast({
                        title: "Úspěch",
                        description: "Téma měsíce bylo uloženo.",
                        variant: "success"
                    });
                    fetchThemes();
                    setKeywords(["", "", ""]);
                } else {
                    throw new Error('Failed to save');
                }
            } catch (error) {
                toast({
                    title: "Chyba",
                    description: "Nepodařilo se uložit téma.",
                    variant: "destructive"
                });
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm("Opravdu chcete smazat toto téma?")) return;

        startTransition(async () => {
            try {
                const response = await fetch(`/api/admin/themes?id=${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    toast({
                        title: "Smazáno",
                        description: "Téma bylo odstraněno.",
                        variant: "success"
                    });
                    fetchThemes();
                }
            } catch (error) {
                toast({
                    title: "Chyba",
                    description: "Nepodařilo se smazat téma.",
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
            <RoleGate allowedRole={UserRole.ADMIN}>
                <div className="max-w-4xl mx-auto p-4 space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Téma měsíce</h1>
                            <p className="text-muted-foreground">Správa měsíčních výzev a klíčových slov</p>
                        </div>
                    </div>

                    {/* Create New Theme */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Nové téma</CardTitle>
                            <CardDescription>Nastavte klíčová slova pro vybraný měsíc</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Rok</label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2024, 2025, 2026].map(y => (
                                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Měsíc</label>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map((m, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Klíčová slova (3 slova)</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {keywords.map((k, i) => (
                                        <Input
                                            key={i}
                                            placeholder={`Slovo ${i + 1}`}
                                            value={k}
                                            onChange={(e) => handleKeywordChange(i, e.target.value)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isPending}
                                className="w-full sm:w-auto"
                            >
                                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Uložit téma
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Existing Themes List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Existující témata</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {themes.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">Žádná nastavená témata</p>
                                ) : (
                                    themes.sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month)).map((theme) => (
                                        <div key={theme.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 text-center">
                                                    <div className="text-xl font-bold">{theme.month}</div>
                                                    <div className="text-xs text-muted-foreground">{theme.year}</div>
                                                </div>
                                                <div className="h-8 w-px bg-border mx-2" />
                                                <div className="flex gap-2 flex-wrap">
                                                    {theme.keywords.map((k, i) => (
                                                        <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm font-medium">
                                                            {k}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(theme.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </RoleGate>
        </CommonPageTemplate>
    );
};

export default AdminThemesPage;
