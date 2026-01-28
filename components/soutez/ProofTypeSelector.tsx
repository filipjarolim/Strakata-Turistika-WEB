'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Place } from '@/lib/scoring-utils';

const PROOF_TYPES = [
    { id: 'kct_sign', label: 'Cedule KČT', icon: '🪧' },
    { id: 'cairn', label: 'Mohyla/Kamenná pyramida', icon: '🗿' },
    { id: 'marker', label: 'Patník/Sloupek', icon: '📍' },
    { id: 'unofficial', label: 'Neoficiální označení', icon: '✍️' },
    { id: 'summit_book', label: 'Vrcholová kniha', icon: '📖' },
    { id: 'other', label: 'Jiné', icon: '❓' }
];

export function ProofTypeSelector({
    value,
    onChange
}: {
    value: string;
    onChange: (type: string) => void
}) {
    return (
        <div className="space-y-3 mt-4">
            <label className="text-xs font-black uppercase tracking-widest text-white/40">
                Typ důkazu na vrcholu
            </label>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                {PROOF_TYPES.map(type => (
                    <button
                        key={type.id}
                        onClick={() => onChange(type.id)}
                        className={cn(
                            "p-3 sm:p-4 rounded-xl border transition-all text-left relative min-h-[64px]",
                            value === type.id
                                ? "bg-white text-black border-white"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        )}
                        type="button"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 pr-6">
                            <span className="text-xl sm:text-2xl flex-shrink-0">{type.icon}</span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase leading-tight line-clamp-2 sm:line-clamp-none">{type.label}</span>
                        </div>

                        {value === type.id && (
                            <CheckCircle className="absolute top-2 right-2 w-4 h-4" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
