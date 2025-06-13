'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import { ChevronLeft, ChevronRight, CalendarRange, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { columns } from '@/components/blocks/vysledky/columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { fetchWithCache, prefetchApiData } from '@/lib/api-utils';
import { DogRestrictionsView } from '@/components/blocks/vysledky/DogRestrictionsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    
    // New state for pagination
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        pageSize: 1000, // Increased from 100 to load more data at once
    });
    
    // Add state for lazy loading
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Add state for infinite scroll detection
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Add prefetch effect
    useEffect(() => {
        // Prefetch seasons data
        prefetchApiData(['/api/seasons']);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Parallel fetch for optimization
                const [years, responseData] = await Promise.all([
                    fetchWithCache<number[]>('/api/seasons'),
                    fetchWithCache<{
                        data: VisitData[],
                        pagination: {
                            totalItems: number,
                            totalPages: number,
                            currentPage: number,
                            pageSize: number
                        }
                    }>(`/api/results/${(await params).rok}?page=1&pageSize=1000&sort=points&order=desc`)
                ]);

                setAllYears(years);
                setYear(parseInt((await params).rok));
                setVisitData(responseData.data || []);
                setPagination(responseData.pagination);
            } catch (error) {
                console.error(error);
                setError(error instanceof Error ? error.message : 'Došlo k chybě při načítání dat.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params]);
    
    const loadMoreData = useCallback(async () => {
        if (loadingMore || pagination.currentPage >= pagination.totalPages) return;
        
        setLoadingMore(true);
        
        try {
            const nextPage = pagination.currentPage + 1;
            const { rok } = await params;
            
            // Add sorting and priority loading parameters
            const responseData = await fetchWithCache<{
                data: VisitData[],
                pagination: {
                    totalItems: number,
                    totalPages: number,
                    currentPage: number,
                    pageSize: number
                }
            }>(`/api/results/${rok}?page=${nextPage}&pageSize=${pagination.pageSize}&sort=points&order=desc`);
            
            // Process and merge data with prioritization
            const newData = responseData.data || [];
            setVisitData(prevData => {
                const merged = [...prevData, ...newData];
                // Sort by points to prioritize higher scores
                return merged.sort((a, b) => b.points - a.points);
            });
            
            setPagination(responseData.pagination);
        } catch (error) {
            console.error('Error loading more data:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, pagination.currentPage, pagination.totalPages, pagination.pageSize, params]);
    
    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        if (!loadMoreRef.current) return;
        
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreData();
                }
            },
            { 
                threshold: 0.25, // Increased threshold for earlier loading
                rootMargin: '100px' // Start loading before element is fully visible
            }
        );
        
        observerRef.current.observe(loadMoreRef.current);
        
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loadMoreRef, loadingMore, pagination, loadMoreData]);

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

                <Tabs defaultValue="table" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="table">Tabulka výsledků</TabsTrigger>
                        <TabsTrigger value="restrictions">Informace o omezeních</TabsTrigger>
                    </TabsList>

                    <TabsContent value="table" className="space-y-4">
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
                                    excludedColumnsInAggregatedView={['visitDate', 'routeLink']}
                                    mainSheetName="Detailní Data"
                                    summarySheetName="Souhrnná Data"
                                    generateSummarySheet={true}
                                    loading={loading}
                                    emptyStateMessage="Pro tento rok nejsou k dispozici žádné výsledky"
                                />
                                
                                {/* Add a load more trigger element that will be observed */}
                                {!loading && pagination.currentPage < pagination.totalPages && (
                                    <div 
                                        ref={loadMoreRef} 
                                        className="w-full mt-4 py-4 flex justify-center"
                                    >
                                        {loadingMore ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <p className="text-muted-foreground text-sm">Načítání dalších výsledků...</p>
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground text-sm">Rolujte pro načtení dalších výsledků</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TooltipProvider>
                    </TabsContent>

                    <TabsContent value="restrictions">
                        <DogRestrictionsView data={visitData} />
                    </TabsContent>
                </Tabs>
            </div>
        </CommonPageTemplate>
    );
};

export default Page;