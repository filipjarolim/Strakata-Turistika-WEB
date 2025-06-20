'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IOSButton } from '@/components/ui/ios/button';
import { IOSSelect } from '@/components/ui/ios/select';
import { cn } from '@/lib/utils';

interface PaginationControlsProps {
    totalRows: number;
    pageIndex: number;
    pageSize: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    className?: string;
}

export const PaginationControls = ({
    totalRows,
    pageIndex,
    pageSize,
    pageSizeOptions = [10, 20, 50, 100],
    onPageChange,
    onPageSizeChange,
    className
}: PaginationControlsProps) => {
    const totalPages = Math.ceil(totalRows / pageSize);
    const canPreviousPage = pageIndex > 0;
    const canNextPage = pageIndex < totalPages - 1;

    const startRow = pageIndex * pageSize + 1;
    const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);

    return (
        <div className={cn("flex flex-col sm:flex-row justify-between items-center gap-4", className)}>
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                    Zobrazeno {startRow} až {endRow} z {totalRows} záznamů
                </span>
                <IOSSelect
                    value={pageSize.toString()}
                    onChange={(value) => onPageSizeChange(Number(value))}
                    options={pageSizeOptions.map(size => ({
                        value: size.toString(),
                        label: `${size} na stránku`
                    }))}
                    className="w-[140px]"
                />
            </div>

            <div className="flex items-center gap-2">
                <IOSButton
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(0)}
                    disabled={!canPreviousPage}
                    className="hidden sm:flex"
                >
                    První
                </IOSButton>

                <IOSButton
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pageIndex - 1)}
                    disabled={!canPreviousPage}
                    icon={<ChevronLeft className="h-4 w-4" />}
                >
                    Předchozí
                </IOSButton>

                <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium">
                        Stránka {pageIndex + 1} z {totalPages}
                    </span>
                </div>

                <IOSButton
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(pageIndex + 1)}
                    disabled={!canNextPage}
                    icon={<ChevronRight className="h-4 w-4" />}
                >
                    Další
                </IOSButton>

                <IOSButton
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={!canNextPage}
                    className="hidden sm:flex"
                >
                    Poslední
                </IOSButton>
            </div>
        </div>
    );
};