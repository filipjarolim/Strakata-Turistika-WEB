import React, { ReactNode } from 'react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Column, Table } from '@tanstack/react-table';

interface ColumnVisibilityMenuProps<TData> {
    table: Table<TData>; // Ensure proper typing of the table
}


export const ColumnVisibilityMenu = <TData,>({ table }: ColumnVisibilityMenuProps<TData>) => {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                    Sloupce <ChevronDown />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {/* Map over the columns and display their headers */}
                {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide?.())
                    .map((column) => {
                        const columnName = extractPlainTextHeader(column, table); // Pass the typed table
                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id as string}
                                className="capitalize"
                                checked={column.getIsVisible?.()}
                                onCheckedChange={(value) => column.toggleVisibility?.(value)}
                            >
                                {columnName}
                            </DropdownMenuCheckboxItem>
                        );
                    })}


                {/* Add a divider for better distinction */}
                <DropdownMenuItem asChild>
                    <hr className="my-2 border-t border-gray-200" />
                </DropdownMenuItem>

                {/* Show All Columns Button */}
                <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() =>
                        table.getAllColumns().forEach((column) => column.toggleVisibility?.(true))
                    }
                >
                    Zobrazit vše
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/**
 * Utility function:
 * Safely extract plain text from `header` definitions.
 */
const extractPlainTextHeader = <TData,>(
    column: Column<TData>,
    table: Table<TData>
): string => {
    try {
        const { header } = column.columnDef;

        if (typeof header === 'string') {
            return header; // Directly return if it's a plain string
        } else if (typeof header === 'function') {
            // Create a valid HeaderContext object using the table parameter
            const result = header({
                column,
                header: undefined as never, // Safe placeholder for the unused `header`
                table, // Pass the typed table object
            });

            // Extract text from React elements recursively if present
            if (React.isValidElement(result)) {
                return extractTextFromReactElement(result);
            } else if (typeof result === 'string') {
                return result; // Return plain string
            }
            return String(result); // Fallback for unexpected cases
        }
        return column.id?.toString() || 'Neznámý sloupec'; // Fallback to ID or default
    } catch (e) {
        return column.id?.toString() || 'Neznámý sloupec'; // Error-handling fallback
    }
};

/**
 * Helper function to extract plain text from React elements recursively.
 /**
 * Helper function to extract plain text from React elements recursively.
 */
const extractTextFromReactElement = (element: ReactNode): string => {
    if (typeof element === 'string' || typeof element === 'number') {
        return element.toString(); // Handle strings and numbers directly
    }
    if (React.isValidElement(element)) {
        // Use type assertion to tell TypeScript that `element.props` is typed correctly
        const children = (element.props as { children?: ReactNode }).children;

        if (Array.isArray(children)) {
            return children.map(extractTextFromReactElement).join(''); // Handle arrays of children
        }
        return extractTextFromReactElement(children); // Handle single child
    }
    return ''; // Default for null, undefined, or unsupported types
};