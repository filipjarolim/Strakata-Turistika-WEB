'use client';

import { Sparkles } from 'lucide-react';

export function ThemeBonusIndicator({
    bonus,
    keywords
}: {
    bonus: number;
    keywords?: string[]
}) {
    if (bonus === 0) return null;

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-purple-400">
                +{bonus} TÉMA MĚSÍCE
            </span>
            {keywords && keywords.length > 0 && (
                <span className="text-[9px] text-purple-300/60 uppercase tracking-wide">
                    ({keywords.join(', ')})
                </span>
            )}
        </div>
    );
}
