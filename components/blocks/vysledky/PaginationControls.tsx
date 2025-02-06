import React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    currentPage: number;
    totalPages: number;
    canGoToPreviousPage: boolean;
    canGoToNextPage: boolean;
    goToPreviousPage: () => void;
    goToNextPage: () => void;
};

export const PaginationControls: React.FC<Props> = ({
                                                        currentPage,
                                                        totalPages,
                                                        canGoToPreviousPage,
                                                        canGoToNextPage,
                                                        goToPreviousPage,
                                                        goToNextPage,
                                                    }) => {
    return (
        <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
                Stránka {currentPage} z {totalPages}
            </div>
            <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!canGoToPreviousPage}>
                    Předchozí
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!canGoToNextPage}>
                    Další
                </Button>
            </div>
        </div>
    );
};