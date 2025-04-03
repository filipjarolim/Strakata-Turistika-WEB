'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { DataTable, VisitData, transformDataToAggregated } from '@/components/blocks/vysledky/DataTable';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarRange, User, ChevronLeft, Filter, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { columns } from '@/components/blocks/vysledky/columns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { fetchWithCache, prefetchApiData } from '@/lib/api-utils';

const YearSelector: React.FC<{ 
    year: number | null; 
    allYears: number[];
    loading: boolean;
    onYearChange: (year: number) => void;
}> = ({ year, allYears, loading, onYearChange }) => {
    const sortedYears = [...allYears].sort((a, b) => b - a);
    
    return (
        <div className="flex items-center gap-2">
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
                                    <span>{year || 'Vše'}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem
                        key="all"
                        onClick={() => onYearChange(0)} // 0 represents all years
                        className={`cursor-pointer ${!year ? 'bg-primary/10 font-medium' : ''}`}
                    >
                        Vše
                    </DropdownMenuItem>
                    {sortedYears.map((yr) => (
                        <DropdownMenuItem
                            key={yr}
                            onClick={() => onYearChange(yr)}
                            className={`cursor-pointer ${yr === year ? 'bg-primary/10 font-medium' : ''}`}
                        >
                            {yr}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default function MojeVysledkyPage() {
    const [visitData, setVisitData] = useState<VisitData[]>([]);
    const [allYears, setAllYears] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const user = useCurrentUser();
    const role = useCurrentRole();
    const router = useRouter();
    
    // Create a ref for the data fetching to avoid duplicate requests
    const dataFetchedRef = useRef(false);
    
    // Add state for lazy loading - user can scroll to see more results
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [displayCount, setDisplayCount] = useState(20);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(true);

    // Calculate filtered data based on selected year
    const filteredData = useMemo(() => {
        if (!visitData) return [];
        if (selectedYear === null) return visitData;
        return visitData.filter(item => {
            const visitYear = item.visitDate 
                ? new Date(item.visitDate).getFullYear() 
                : null;
            return visitYear === selectedYear;
        });
    }, [visitData, selectedYear]);

    // Slice the data based on current display count
    const displayData = useMemo(() => {
        return filteredData.slice(0, displayCount);
    }, [filteredData, displayCount]);

    // Add prefetching on first load
    useEffect(() => {
        // Prefetch seasons data
        prefetchApiData(['/api/seasons']);
    }, []);
    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (user === null) {
            router.push('/prihlaseni?callbackUrl=/vysledky/moje');
            setShouldRender(false);
        } else {
            setShouldRender(true);
        }
    }, [user, router]);

    // User data fetching
    useEffect(() => {
        // Only run if we should render and data not yet fetched
        if (!shouldRender || !user || dataFetchedRef.current) return;
        
        const fetchUserData = async () => {
            setLoading(true);
            setError(null);
            dataFetchedRef.current = true;
            
            try {
                // Fetch all available years using the cached API
                const years = await fetchWithCache<number[]>('/api/seasons');
                setAllYears(years);

                // Get all the user's results at once using the cached API
                const data = await fetchWithCache<VisitData[]>('/api/user/results');
                
                // Sort by date descending for better display
                const sortedData = [...data].sort((a, b) => {
                    if (!a.visitDate || !b.visitDate) return 0;
                    return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
                });
                
                setVisitData(sortedData);
            } catch (error) {
                console.error(error);
                setError(error instanceof Error ? error.message : 'Došlo k chybě při načítání dat.');
            } finally {
                setLoading(false);
                setIsInitialLoad(false);
            }
        };

        fetchUserData();
    }, [user, shouldRender]);
    
    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        if (!loadMoreRef.current || loading || !shouldRender) return;
        
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && displayCount < filteredData.length) {
                    // Load more items when scrolling to the bottom
                    setDisplayCount(prev => Math.min(prev + 20, filteredData.length));
                }
            },
            { threshold: 0.1 }
        );
        
        observerRef.current.observe(loadMoreRef.current);
        
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loadMoreRef, displayCount, filteredData.length, loading, shouldRender]);

    const handleYearChange = (year: number) => {
        setSelectedYear(year === 0 ? null : year);
        // Reset display count when changing years
        setDisplayCount(20);
    };
    
    // Don't render if not authenticated
    if (!shouldRender) {
        return null;
    }

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
                                <ChevronLeft className="h-4 w-4 inline-block" /> Zpět na přehled sezón
                            </Link>
                            <h1 className="text-3xl md:text-4xl font-bold text-primary flex items-center gap-3">
                                <User className="h-7 w-7" />
                                Moje výsledky
                            </h1>
                            {user?.name && (
                                <p className="text-muted-foreground mt-1">
                                    Přehled výsledků pro: <span className="font-medium">{user.name}</span>
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <YearSelector 
                                year={selectedYear} 
                                allYears={allYears}
                                loading={loading}
                                onYearChange={handleYearChange}
                            />
                        </div>
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
                            data={displayData} 
                            columns={columns}
                            year={selectedYear || new Date().getFullYear()} 
                            primarySortColumn="visitDate"
                            primarySortDesc={true}
                            transformToAggregatedView={transformDataToAggregated}
                            filterConfig={{ 
                                dateField: 'visitDate',
                                numberField: 'points'
                            }}
                            filename={`moje_vysledky${selectedYear ? '_' + selectedYear : ''}`}
                            enableDownload={true}
                            enableAggregatedView={!selectedYear}
                            aggregatedViewLabel="Souhrnný přehled"
                            detailedViewLabel="Detailní pohled"
                            enableColumnVisibility={true}
                            enableSearch={true}
                            excludedColumnsInAggregatedView={['visitDate', 'dogNotAllowed', 'routeLink', 'fullName']}
                            mainSheetName="Detailní Data"
                            summarySheetName="Souhrnná Data"
                            generateSummarySheet={true}
                            loading={loading}
                            emptyStateMessage={
                                selectedYear 
                                    ? `Pro rok ${selectedYear} nemáte žádné výsledky` 
                                    : "Zatím nemáte žádné výsledky"
                            }
                        />
                        
                        {/* Add a load more indicator */}
                        {!loading && displayCount < filteredData.length && (
                            <div 
                                ref={loadMoreRef} 
                                className="w-full mt-4 py-4 flex justify-center"
                            >
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <p className="text-muted-foreground text-sm">Načítání dalších výsledků...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </TooltipProvider>
            </div>
        </CommonPageTemplate>
    );
} 