'use client';

import React, { useState, type ReactNode } from 'react';
import { type Column, type Table } from '@tanstack/react-table';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSSlidePanel } from '@/components/ui/ios/slide-panel';
import { IOSSwitch } from '@/components/ui/ios/switch';
import { cn } from '@/lib/utils';

interface ColumnVisibilityMenuProps<TData> {
    table: Table<TData>;
    isAggregatedView?: boolean;
    className?: string;
}

export const ColumnVisibilityMenu = <TData,>({
    table,
    isAggregatedView = false,
    className
}: ColumnVisibilityMenuProps<TData>) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IOSButton
                    variant="outline"
                    size="sm"
                onClick={() => setIsOpen(true)}
                className={className}
            >
                Sloupce
            </IOSButton>

            <IOSSlidePanel
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                side="right"
                className="bg-white/80 backdrop-blur-lg border-l"
            >
                <div className="p-4 border-b bg-white/50">
                    <h2 className="text-lg font-semibold text-gray-900">Viditelnost sloupců</h2>
                    <p className="text-sm text-gray-500">Vyberte sloupce, které chcete zobrazit v tabulce</p>
                </div>

                <div className="p-4 space-y-4">
                    {table.getAllColumns()
                        .filter(column => column.getCanHide())
                        .map(column => {
                            const columnLabel = column.columnDef.header?.toString() || column.id;
                        return (
                                <div key={column.id} className="flex items-center justify-between py-2">
                                    <IOSSwitch
                                        label={columnLabel}
                                checked={column.getIsVisible()}
                                        onCheckedChange={value => column.toggleVisibility(!!value)}
                                    />
                                </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t">
                    <IOSButton
                        onClick={() => setIsOpen(false)}
                        className="w-full"
                    >
                        Hotovo
                    </IOSButton>
                </div>
            </IOSSlidePanel>
        </>
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