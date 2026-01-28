'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IOSCard } from '@/components/ui/ios/card';
import { IOSButton } from '@/components/ui/ios/button';
import { CheckCircle2, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import CompetitionBackground from '@/components/ui/competition/CompetitionBackground';

export default function BulkOperationsPage() {
    const [isApproveLoading, setIsApproveLoading] = useState(false);
    const [isRecalcLoading, setIsRecalcLoading] = useState(false);

    const handleBulkApprove = async () => {
        if (!confirm('Opravdu chcete hromadně schválit všechny nevyřízené návštěvy pro aktuální sezónu?')) return;

        setIsApproveLoading(true);
        try {
            const res = await fetch('/api/admin/bulk-approve', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                toast.success(`Hromadně schváleno ${data.count} návštěv.`);
            } else {
                toast.error(data.error || 'Operace selhala.');
            }
        } catch (error) {
            toast.error('Došlo k chybě při komunikaci se serverem.');
        } finally {
            setIsApproveLoading(false);
        }
    };

    const handleRecalculatePoints = async () => {
        if (!confirm('VAROVÁNÍ: Tato operace přepočítá body pro VŠECHNY schválené návštěvy aktuální sezóny podle aktuálního nastavení bodování. Pokračovat?')) return;

        setIsRecalcLoading(true);
        try {
            const res = await fetch('/api/admin/recalculate-points', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                toast.success(`Body byly přepočítány pro ${data.count} návštěv.`);
            } else {
                toast.error(data.error || 'Operace selhala.');
            }
        } catch (error) {
            toast.error('Došlo k chybě při komunikaci se serverem.');
        } finally {
            setIsRecalcLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white relative pb-20">
            <CompetitionBackground />

            <div className="max-w-4xl mx-auto px-6 pt-24 relative z-10">
                <div className="flex items-center gap-4 mb-12">
                    <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30">
                        <ShieldAlert className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter italic">
                            Hromadné operace
                        </h1>
                        <p className="text-white/40 uppercase tracking-widest text-xs font-bold">
                            Nástroje pro správu databáze a opravy bodování
                        </p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <IOSCard
                        title="Hromadné schválení"
                        subtitle="Všechny nevyřízené návštěvy (PENDING_REVIEW)"
                        icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
                        className="bg-black/40 backdrop-blur-md border-white/10"
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-white/60 leading-relaxed">
                                Tato funkce automaticky změní stav všech návštěv v aktuální sezóně, které čekají na kontrolu, na <strong>SCHVÁLENO</strong>.
                                Používejte pouze pokud jste si jisti, že všechna data jsou v pořádku.
                            </p>

                            <div className="pt-4 flex justify-end">
                                <IOSButton
                                    variant="blue"
                                    onClick={handleBulkApprove}
                                    disabled={isApproveLoading}
                                    loading={isApproveLoading}
                                >
                                    Schválit vše
                                </IOSButton>
                            </div>
                        </div>
                    </IOSCard>

                    <IOSCard
                        title="Přepočet bodování"
                        subtitle="Aktualizace bodů podle nového nastavení"
                        icon={<RefreshCw className="w-5 h-5 text-blue-400" />}
                        className="bg-black/40 backdrop-blur-md border-white/10"
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-white/60 leading-relaxed">
                                Pokud dojde ke změně v pravidlech bodování (např. body za km, body za typy míst), tato funkce projde všechny schválené návštěvy
                                a znovu vypočítá jejich bodový zisk.
                            </p>

                            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>Pozor: Tato operace může trvat delší dobu v závislosti na počtu záznamů.</span>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <IOSButton
                                    variant="outline"
                                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                    onClick={handleRecalculatePoints}
                                    disabled={isRecalcLoading}
                                    loading={isRecalcLoading}
                                >
                                    Spustit přepočet
                                </IOSButton>
                            </div>
                        </div>
                    </IOSCard>
                </div>

                <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/10 text-center">
                    <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] font-black">
                        Administrace systému &bull; Strakatá Turistika 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
