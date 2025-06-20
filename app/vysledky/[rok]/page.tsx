'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import Link from 'next/link';
import { ChevronLeft, CalendarDays } from 'lucide-react';
import { DataTable } from '@/components/blocks/vysledky/DataTable';
import { DogRestrictionsView } from '@/components/blocks/vysledky/DogRestrictionsView';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { columns } from '@/components/blocks/vysledky/columns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { VisitData } from '@/components/blocks/vysledky/DataTable';
import { IOSCard } from '@/components/ui/ios/card';

export default function SeasonResultsPage() {
    const params = useParams();
    const year = parseInt(params.rok as string);
    const user = useCurrentUser();
    const role = useCurrentRole();

    const [data, setData] = useState<VisitData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    // Stats for the current year
    const stats = useMemo(() => {
        if (!data.length) return null;
        
        return {
            totalVisits: data.length,
            totalPoints: data.reduce((sum, item) => sum + item.points, 0),
            uniquePlaces: new Set(data.flatMap(item => item.visitedPlaces?.split(',').map(p => p.trim()) || [])).size,
            restrictedPlaces: data.filter(item => item.dogNotAllowed === "true").length,
        };
    }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/results/${year}?page=${currentPage}&pageSize=${pageSize}`
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        setError(`Pro rok ${year} nejsou k dispozici žádné výsledky.`);
                        return;
                    }
                    throw new Error('Failed to fetch data');
                }

                const result = await response.json();
                setData(result.data);
                setTotalPages(result.pagination.totalPages);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Došlo k chybě při načítání dat.');
            } finally {
                setLoading(false);
            }
        };

        if (!isNaN(year)) {
            fetchData();
        } else {
            setError('Neplatný rok.');
        }
    }, [year, currentPage, pageSize]);

    if (error) {
        return (
            <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
                <div className="container mx-auto p-4 md:p-6 max-w-7xl">
                    <Link 
                        href="/vysledky" 
                        className="text-sm text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" /> Zpět na přehled sezón
                    </Link>
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Chyba</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </div>
            </CommonPageTemplate>
        );
    }

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode="auto-hide" currentUser={user} currentRole={role}>
            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
                {/* Header Section */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                        <Link 
                            href="/vysledky" 
                            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Zpět na přehled sezón
                        </Link>
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-primary">
                                    Sezóna {year}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Výsledky turistické sezóny
                                </p>
                            </div>
                            {year === new Date().getFullYear() && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    Aktuální sezóna
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <IOSCard>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">{stats.totalVisits}</div>
                                    <p className="text-muted-foreground text-sm">Celkem návštěv</p>
                                </CardContent>
                            </IOSCard>
                            <IOSCard>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">{stats.totalPoints}</div>
                                    <p className="text-muted-foreground text-sm">Celkem bodů</p>
                                </CardContent>
                            </IOSCard>
                            <IOSCard>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">{stats.uniquePlaces}</div>
                                    <p className="text-muted-foreground text-sm">Unikátních míst</p>
                                </CardContent>
                            </IOSCard>
                            <IOSCard>
                                <CardContent className="pt-6">
                                    <div className="text-2xl font-bold">{stats.restrictedPlaces}</div>
                                    <p className="text-muted-foreground text-sm">Míst s omezením</p>
                                </CardContent>
                            </IOSCard>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    {/* Results Table */}
                    <div className="space-y-4">
                        <TooltipProvider>
                            {loading ? (
                                <div className="space-y-4">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-[400px] w-full" />
                                </div>
                            ) : (
                                <DataTable
                                    data={data}
                                    columns={columns}
                                    year={year}
                                    primarySortColumn="visitDate"
                                    primarySortDesc={false}
                                    filterConfig={{
                                        dateField: 'visitDate',
                                        numberField: 'points'
                                    }}
                                    filename={`vysledky_${year}`}
                                    enableDownload={true}
                                    enableAggregatedView={true}
                                    aggregatedViewLabel="Souhrnný přehled"
                                    detailedViewLabel="Detailní pohled"
                                    enableColumnVisibility={true}
                                    enableSearch={true}
                                    excludedColumnsInAggregatedView={['visitDate', 'dogNotAllowed', 'routeLink']}
                                    mainSheetName="Výsledky"
                                    summarySheetName="Souhrn"
                                    generateSummarySheet={true}
                                    loading={loading}
                                    emptyStateMessage={`Pro rok ${year} nejsou k dispozici žádné výsledky.`}
                                />
                            )}
                        </TooltipProvider>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Dog Restrictions */}
                        {!loading && data.length > 0 && (
                            <DogRestrictionsView data={data} />
                        )}
                    </div>
                </div>
            </div>
        </CommonPageTemplate>
    );
}