'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, VisitData, transformDataToAggregated } from '@/components/blocks/vysledky/DataTable';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { columns } from '@/components/blocks/vysledky/columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

const YearSelector: React.FC<{ 
    year: number | null; 
    allYears: number[];
    loading: boolean;
}> = ({ year, allYears, loading }) => {
    const router = useRouter();
    const sortedYears = [...allYears].sort((a, b) => b - a);
    
    const currentIndex = year ? sortedYears.findIndex(y => y === year) : -1;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < sortedYears.length - 1 && currentIndex !== -1;
    
    const handleYearChange = (direction: 'next' | 'prev') => {
        if (!year) return;
        
        let newYear: number;
        if (direction === 'next' && hasNext) {
            newYear = sortedYears[currentIndex + 1];
            router.push(`/vysledky/${newYear}`);
        } else if (direction === 'prev' && hasPrevious) {
            newYear = sortedYears[currentIndex - 1];
            router.push(`/vysledky/${newYear}`);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                disabled={!hasPrevious || loading}
                onClick={() => handleYearChange('prev')}
                className="h-10 w-10"
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="min-w-28 font-medium text-lg"
                        disabled={loading}
                    >
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <Skeleton className="h-7 w-16" />
                            ) : (
                                <motion.div
                                    key={year}
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-2"
                                >
                                    <CalendarRange className="h-4 w-4 text-muted-foreground" />
                                    <span>{year}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="max-h-[300px] overflow-y-auto">
                    {sortedYears.map((yr) => (
                        <DropdownMenuItem
                            key={yr}
                            onClick={() => router.push(`/vysledky/${yr}`)}
                            className={`cursor-pointer ${yr === year ? 'bg-primary/10 font-medium' : ''}`}
                        >
                            {yr}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
                variant="outline"
                size="icon"
                disabled={!hasNext || loading}
                onClick={() => handleYearChange('next')}
                className="h-10 w-10"
            >
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    );
};

const Page = ({ params }: { params: Promise<{ rok: string }> }) => {
    const [visitData, setVisitData] = useState<VisitData[]>([]);
    const [allYears, setAllYears] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const user = useCurrentUser();
    const role = useCurrentRole();
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch all available years
                const yearsRes = await fetch('/api/seasons');
                if (!yearsRes.ok) throw new Error('Nepodařilo se načíst dostupné roky.');
                const years = await yearsRes.json();
                setAllYears(years);

                // Fetch data for the specified year
                const { rok } = await params;
                const yearNum = parseInt(rok);
                setYear(yearNum);
                
                const res = await fetch(`/api/results/${rok}`);
                if (!res.ok) throw new Error('Nepodařilo se načíst data pro tento rok.');
                const data: VisitData[] = await res.json();
                setVisitData(data);
            } catch (error) {
                console.error(error);
                setError(error instanceof Error ? error.message : 'Došlo k chybě při načítání dat.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params]);

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <Link 
                                href="/vysledky" 
                                className="text-sm text-muted-foreground hover:text-primary mb-2 inline-block"
                            >
                                ← Zpět na přehled sezón
                            </Link>
                            <h1 className="text-3xl md:text-4xl font-bold text-primary">
                                Výsledky sezóny
                            </h1>
                        </div>
                        
                        <YearSelector 
                            year={year} 
                            allYears={allYears}
                            loading={loading}
                        />
                    </div>
                    
                    {error && (
                        <Card className="bg-destructive/10 border-destructive/20 mb-6">
                            <CardContent className="p-4">
                                <p className="text-destructive">{error}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <TooltipProvider>
                    <div className="bg-card rounded-lg border shadow-sm p-4">
                        <DataTable 
                            data={visitData} 
                            columns={columns}
                            year={year || new Date().getFullYear()} 
                            primarySortColumn="points"
                            primarySortDesc={true}
                            transformToAggregatedView={transformDataToAggregated}
                            filterConfig={{ 
                                dateField: 'visitDate',
                                numberField: 'points'
                            }}
                            filename={`strakataturistika_vysledky_${year}`}
                            enableDownload={true}
                            enableAggregatedView={true}
                            aggregatedViewLabel="Souhrnný přehled"
                            detailedViewLabel="Detailní pohled"
                            enableColumnVisibility={true}
                            enableSearch={true}
                            excludedColumnsInAggregatedView={['visitDate', 'dogNotAllowed', 'routeLink']}
                            mainSheetName="Detailní Data"
                            summarySheetName="Souhrnná Data"
                            generateSummarySheet={true}
                            loading={loading}
                            emptyStateMessage="Pro tento rok nejsou k dispozici žádné výsledky"
                        />
                    </div>
                </TooltipProvider>
            </div>
        </CommonPageTemplate>
    );
};

export default Page;