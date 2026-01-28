'use client';

import { Trophy, Users, TrendingUp } from 'lucide-react';

interface CreatorStatsProps {
    routeId: string;
    creatorName: string;
    completionCount: number;
    totalBonusPoints: number;
}

export function CreatorStatsCard({
    routeId,
    creatorName,
    completionCount,
    totalBonusPoints
}: CreatorStatsProps) {
    return (
        <div className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-black uppercase tracking-wider text-sm text-white">Stats tvůrce</h3>
            </div>

            <div className="space-y-3 text-white">
                <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider text-white/60">Tvůrce</span>
                    <span className="font-bold">{creatorName}</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider text-white/60 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Dokončení
                    </span>
                    <span className="font-bold text-amber-400">{completionCount}×</span>
                </div>

                <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wider text-white/60 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Bonusové body
                    </span>
                    <span className="font-bold text-green-400">+{totalBonusPoints}</span>
                </div>
            </div>
        </div>
    );
}
