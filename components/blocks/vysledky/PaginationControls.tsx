import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type Props = {
    totalRows: number;
    pageIndex: number;
    pageSize: number;
    pageSizeOptions: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
};

export const PaginationControls: React.FC<Props> = ({
    totalRows,
    pageIndex,
    pageSize,
    pageSizeOptions,
    onPageChange,
    onPageSizeChange,
}) => {
    const totalPages = Math.ceil(totalRows / pageSize);
    const isFirstPage = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1 || totalPages === 0;
    
    const from = pageIndex * pageSize + 1;
    const to = Math.min((pageIndex + 1) * pageSize, totalRows);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="text-sm text-muted-foreground">
                {totalRows > 0 ? (
                    <>
                        Zobrazeno <span className="font-medium">{from}</span> až{' '}
                        <span className="font-medium">{to}</span> z{' '}
                        <span className="font-medium">{totalRows}</span> záznamů
                    </>
                ) : (
                    'Žádné záznamy'
                )}
            </div>
            
            <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(0)}
                        disabled={isFirstPage}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(pageIndex - 1)}
                        disabled={isFirstPage}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <span className="text-sm font-medium mx-2">
                        Strana {pageIndex + 1} z {totalPages || 1}
                    </span>
                    
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(pageIndex + 1)}
                        disabled={isLastPage}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(totalPages - 1)}
                        disabled={isLastPage}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
                
                <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => onPageSizeChange(Number(value))}
                >
                    <SelectTrigger className="h-8 w-[100px]">
                        <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                        {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size} na stránku
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};