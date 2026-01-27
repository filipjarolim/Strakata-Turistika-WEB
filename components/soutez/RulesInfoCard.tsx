import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2, Info, MapPin } from 'lucide-react';

export function RulesInfoCard({ type }: { type: 'photo-limit' | 'walking-only' | 'free-category' | 'strata' }) {
    const content = {
        'photo-limit': {
            title: 'Časový limit fotek',
            message: 'Fotky nesmí být starší než 14 dní od data návštěvy.',
            icon: Clock,
            color: 'text-amber-500'
        },
        'walking-only': {
            title: 'Pouze chůze',
            message: 'V ročníku 2025/2026 je povolena pouze chůze. Jiné druhy pohybu nebudou uznány.',
            icon: Info,
            color: 'text-blue-500'
        },
        'free-category': {
            title: 'Volná kategorie',
            message: 'Jednou týdně můžete nahrát libovolné místo. Získáte 1 bod.',
            icon: CheckCircle2,
            color: 'text-green-500'
        },
        'strata': {
            title: 'Strakatá trasa',
            message: 'Každou kategorii lze využít 1× měsíčně.',
            icon: MapPin,
            color: 'text-purple-500'
        }
    };

    const config = content[type] || content['walking-only'];
    const Icon = config.icon;

    return (
        <Alert className="bg-white/5 border-white/10 text-white">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <AlertTitle className={`${config.color}`}>{config.title}</AlertTitle>
            <AlertDescription className="text-white/60">
                {config.message}
            </AlertDescription>
        </Alert>
    );
}
