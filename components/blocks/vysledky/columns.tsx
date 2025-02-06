import { ColumnDef, Column } from '@tanstack/react-table';
import { VisitData } from './DataTable';
import { ArrowUp, ArrowDown, ArrowUpDown, Dog, Link, Check, X } from 'lucide-react';
import { VisitedPlacesCell } from './VisitedPlacesCell';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

// Helper: Render sortable column header with text
const renderSortableHeaderWithText = <TData,>(column: Column<TData, unknown>, label: string) => (
    <div className="flex items-center space-x-1">
        <span>{label}</span>
        <button
            className="p-0 m-0 h-auto w-auto"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
            ) : (
                <ArrowUpDown className="h-4 w-4" />
            )}
        </button>
    </div>
);

// Helper: Render icon-only header with tooltip
const renderIconOnlyHeader = (icon: React.ReactNode, tooltip: string) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <span className="cursor-default">{icon}</span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
);

export const columns: ColumnDef<VisitData>[] = [
    // Header with text + sorting
    {
        accessorKey: 'visitDate',
        header: ({ column }) => renderSortableHeaderWithText(column, 'Datum návštěvy'), // Czech translation
        cell: ({ row }) => {
            const date = row.getValue('visitDate') as string | null;
            return date ? new Date(date).toLocaleDateString('cs-CZ') : 'N/A';
        },
    },
    // Header with text + sorting
    {
        accessorKey: 'fullName',
        header: ({ column }) => renderSortableHeaderWithText(column, 'Jméno'), // Czech translation
    },
    // Header with text + sorting
    {
        accessorKey: 'dogName',
        header: ({ column }) => renderSortableHeaderWithText(column, 'Jméno psa'), // Czech translation
        cell: ({ row }) => row.getValue('dogName') || 'N/A',
    },
    // Header with right-aligned text + sorting
    {
        accessorKey: 'points',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                {renderSortableHeaderWithText(column, 'Body')} {/* Czech translation */}
            </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.getValue('points')}</div>,
    },
    // Header with static text
    {
        accessorKey: 'visitedPlaces',
        header: 'Navštívená místa', // Czech translation
        cell: ({ row }) => <VisitedPlacesCell visitedPlaces={row.getValue('visitedPlaces')} />,
    },
    // Header with icon-only + tooltip (Dog icon)
    {
        accessorKey: 'dogNotAllowed',
        header: () =>
            renderIconOnlyHeader(
                <Dog className="h-4 w-4" />, // Dog icon (black, uncolored)
                'Indikuje, zda jsou psi povoleni' // Czech tooltip
            ),
        // Cell with Check or Cross icon
        cell: ({ row }) => {
            const dogNotAllowed = row.getValue('dogNotAllowed') as boolean;
            return dogNotAllowed ? (
                <X className="h-5 w-5" /> // Black cross for not allowed
            ) : (
                <Check className="h-5 w-5" /> // Black check for allowed
            );
        },
    },
    // Header with icon-only + tooltip (Link icon)
    {
        accessorKey: 'routeLink',
        header: () =>
            renderIconOnlyHeader(
                <Link className="h-4 w-4" />, // Link icon (black, uncolored)
                'Odkaz na trasu' // Czech tooltip
            ),
        // Cell with clickable Link icon or Cross
        cell: ({ row }) => {
            const link = row.getValue('routeLink') as string | null;
            return link ? (
                <a href={link} target="_blank" rel="noopener noreferrer">
                    <Link className="h-5 w-5" />
                </a>
            ) : (
                <X className="h-5 w-5" /> // Black cross if no link available
            );
        },
    },
];