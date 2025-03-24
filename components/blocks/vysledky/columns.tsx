import { ColumnDef, Column } from '@tanstack/react-table';
import { VisitData } from './DataTable';
import { ArrowUp, ArrowDown, ArrowUpDown, Dog, Link as LinkIcon, Check, X, Calendar, User, Medal, Info, MapPin } from 'lucide-react';
import { VisitedPlacesCell } from './VisitedPlacesCell';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Helper: Render sortable column header with text
const renderSortableHeaderWithText = <TData,>(column: Column<TData, unknown>, label: string, tooltip?: string) => (
    <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground font-medium">{label}</span>
        {tooltip && (
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-popover/95 backdrop-blur-sm p-3 text-xs shadow-xl rounded-lg border border-border/50">
                    {tooltip}
                </TooltipContent>
            </Tooltip>
        )}
        <button
            className="p-0 m-0 h-auto w-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
            ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
            ) : (
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
            )}
        </button>
    </div>
);

// Helper: Render icon-only header with tooltip
const renderIconOnlyHeader = (icon: React.ReactNode, tooltip: string) => (
    <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
            <div className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted cursor-default">
                {icon}
            </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-popover/95 backdrop-blur-sm p-3 text-xs shadow-xl rounded-lg border border-border/50">
            {tooltip}
        </TooltipContent>
    </Tooltip>
);

export const columns: ColumnDef<VisitData>[] = [
    // Date column
    {
        accessorKey: 'visitDate',
        header: ({ column }) => (
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {renderSortableHeaderWithText(column, 'Datum návštěvy', 'Datum, kdy byla návštěva uskutečněna')}
            </div>
        ), 
        cell: ({ row }) => {
            const date = row.getValue('visitDate') as string | null;
            if (!date) return <span className="text-muted-foreground">—</span>;
            
            const formattedDate = new Date(date).toLocaleDateString('cs-CZ');
            return (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="py-0.5 px-2 bg-primary/5 border-primary/20">
                        {formattedDate}
                    </Badge>
                </div>
            );
        },
        size: 140,
    },
    // Name column
    {
        accessorKey: 'fullName',
        header: ({ column }) => (
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {renderSortableHeaderWithText(column, 'Jméno', 'Celé jméno účastníka')}
            </div>
        ),
        cell: ({ row }) => {
            const name = row.getValue('fullName') as string;
            return (
                <div className="font-medium">{name}</div>
            );
        },
        size: 180,
    },
    // Dog name column
    {
        accessorKey: 'dogName',
        header: ({ column }) => (
            <div className="flex items-center gap-2">
                <Dog className="h-4 w-4 text-muted-foreground" />
                {renderSortableHeaderWithText(column, 'Jméno psa', 'Jméno psa, který byl na výletě')}
            </div>
        ),
        cell: ({ row }) => {
            const dogName = row.getValue('dogName') as string | null;
            return dogName ? <span>{dogName}</span> : <span className="text-muted-foreground">—</span>;
        },
        size: 150,
    },
    // Points column
    {
        accessorKey: 'points',
        header: ({ column }) => (
            <div className="flex items-center gap-2 justify-end">
                <Medal className="h-4 w-4 text-muted-foreground" />
                {renderSortableHeaderWithText(column, 'Body', 'Počet bodů získaných za návštěvu')}
            </div>
        ),
        cell: ({ row }) => {
            const points = row.getValue('points') as number;
            return (
                <div className="text-right">
                    <Badge className="bg-primary/90">{points}</Badge>
                </div>
            );
        },
        size: 100,
    },
    // Visited places column
    {
        accessorKey: 'visitedPlaces',
        header: () => (
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">Navštívená místa</span>
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-popover/95 backdrop-blur-sm p-3 text-xs shadow-xl rounded-lg border border-border/50">
                        Seznam míst, která byla navštívena. Kliknutím na místo vyhledáte více informací nebo klikněte na + pro zobrazení všech.
                    </TooltipContent>
                </Tooltip>
            </div>
        ),
        cell: ({ row }) => <VisitedPlacesCell visitedPlaces={row.getValue('visitedPlaces')} />,
        size: 200,
    },
    // Dog allowed column
    {
        accessorKey: 'dogNotAllowed',
        header: () =>
            renderIconOnlyHeader(
                <Dog className="h-4 w-4 text-muted-foreground" />,
                'Indikuje, zda jsou psi na daném místě povoleni'
            ),
        cell: ({ row }) => {
            const dogNotAllowed = row.getValue('dogNotAllowed') as boolean;
            return (
                <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                        <div className="flex justify-center">
                            {dogNotAllowed ? (
                                <div className="rounded-full p-1 bg-destructive/10">
                                    <X className="h-4 w-4 text-destructive" />
                                </div>
                            ) : (
                                <div className="rounded-full p-1 bg-success/10">
                                    <Check className="h-4 w-4 text-success" />
                                </div>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs bg-popover/95 backdrop-blur-sm p-3 text-xs shadow-xl rounded-lg border border-border/50">
                        {dogNotAllowed ? 'Psi nejsou na tomto místě povoleni' : 'Psi jsou na tomto místě povoleni'}
                    </TooltipContent>
                </Tooltip>
            );
        },
        size: 70,
    },
    // Route link column
    {
        accessorKey: 'routeLink',
        header: () =>
            renderIconOnlyHeader(
                <LinkIcon className="h-4 w-4 text-muted-foreground" />,
                'Odkaz na mapu trasy nebo další informace'
            ),
        cell: ({ row }) => {
            const link = row.getValue('routeLink') as string | null;
            return (
                <div className="flex justify-center">
                    {link ? (
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="rounded-full p-1 hover:bg-primary/10 transition-colors"
                                >
                                    <LinkIcon className="h-4 w-4 text-primary" />
                                </a>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs bg-popover/95 backdrop-blur-sm p-3 text-xs shadow-xl rounded-lg border border-border/50">
                                Otevřít odkaz na trasu v novém okně
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="rounded-full p-1 text-muted-foreground/50">
                            <X className="h-4 w-4" />
                        </div>
                    )}
                </div>
            );
        },
        size: 70,
    },
];