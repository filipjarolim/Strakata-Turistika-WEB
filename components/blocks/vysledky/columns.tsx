import { ColumnDef, Column } from '@tanstack/react-table';
import { VisitData } from './DataTable';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { VisitedPlacesCell } from './VisitedPlacesCell';

// Helper: Render sortable column header
const renderSortableHeader = <TData,>(column: Column<TData, unknown>, label: string) => (
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

export const columns: ColumnDef<VisitData>[] = [
    {
        accessorKey: 'visitDate',
        header: ({ column }) => renderSortableHeader(column, 'Datum Návštěvy'),
        cell: ({ row }) => {
            const date = row.getValue('visitDate') as string | null;
            return date ? new Date(date).toLocaleDateString() : 'N/A';
        },
    },
    {
        accessorKey: 'fullName',
        header: ({ column }) => renderSortableHeader(column, 'Jméno'),
    },
    {
        accessorKey: 'dogName',
        header: ({ column }) => renderSortableHeader(column, 'Jméno Psa'),
        cell: ({ row }) => row.getValue('dogName') || 'N/A',
    },
    {
        accessorKey: 'points',
        header: ({ column }) => (
            <div className="flex items-center space-x-1 justify-end">
                {renderSortableHeader(column, 'Body')}
            </div>
        ),
        cell: ({ row }) => <div className="text-right font-medium">{row.getValue('points')}</div>,
    },
    {
        accessorKey: 'visitedPlaces',
        header: 'Navštívená Místa',
        cell: ({ row }) => <VisitedPlacesCell visitedPlaces={row.getValue('visitedPlaces')} />,
    },
    {
        accessorKey: 'dogNotAllowed',
        header: 'Pes nepovolen',
        cell: ({ row }) => (row.getValue('dogNotAllowed') ? 'Ano' : 'Ne'),
    },
    {
        accessorKey: 'routeLink',
        header: 'Odkaz na trasu',
        cell: ({ row }) => {
            const link = row.getValue('routeLink') as string | null;
            return link ? (
                <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                >
                    Zobrazit trasu
                </a>
            ) : (
                'N/A'
            );
        },
    },
];