'use client';

import React, { useEffect, useState } from 'react';
import { DataTable, VisitData } from '@/components/blocks/vysledky/DataTable';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion"; // For Animations
import { ChevronDown } from "lucide-react"; // Import arrow icon from Lucide React
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { columns } from '@/components/blocks/vysledky/columns';
import { transformVisitDataToCumulative } from '@/components/blocks/vysledky/DownloadDataButton';

const YearDropdown: React.FC<{ year: number | null; allYears: number[] }> = ({ year, allYears }) => {
    const router = useRouter();
    const [currentYear, setCurrentYear] = useState<number | null>(year);

    const handleYearSelection = (selectedYear: number) => {
        setCurrentYear(selectedYear);
        router.push(`/vysledky/${selectedYear}`); // Redirect to the selected year

    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center font-bold text-5xl text-black focus:outline-none bg-gray-100 rounded-full p-2 px-4">
                    {/* Animate the year change using Framer Motion */}
                    <motion.span
                        key={currentYear} // Ensure re-render on change
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentYear}
                    </motion.span>
                    <ChevronDown className="ml-1 w-8 h-8 text-black" /> {/* Add arrow icon */}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white shadow-md rounded-md py-2 w-44">
                {allYears.map((yr) => (
                    <DropdownMenuItem
                        key={yr}
                        onClick={() => handleYearSelection(yr)}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 rounded text-black text-lg transition"
                    >
                        {yr}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


const Page = ({ params }: { params: Promise<{ rok: string }> }) => {
    const [visitData, setVisitData] = useState<VisitData[]>([]);
    const [allYears, setAllYears] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const user = useCurrentUser();
    const role = useCurrentRole();
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch years (seasons)
                const yearsRes = await fetch('/api/results');
                const years = await yearsRes.json();
                setAllYears(years);

                // Fetch data for the specified year
                const { rok } = await params;
                setYear(parseInt(rok));
                const res = await fetch(`/api/results/${rok}`);
                const data: VisitData[] = await res.json();
                setVisitData(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params]);



    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="text-4xl font-bold mb-4 text-black/70 pt-4">
                {loading ? (
                    <div className="flex flex-row items-center gap-x-2">
                            Výsledky z roku{' '}
                            <Skeleton className="h-12 w-1/4" />
                        </div>
                ) : (
                    <div className="flex flex-row items-center gap-x-2">
                        Výsledky z roku{' '}
                        <YearDropdown year={year} allYears={allYears}  />
                    </div>
                )}
            </div>

            <div className="mb-4">
                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" /> {/* Simulated header */}
                        {Array.from({ length: 3 }, (_, index) => (
                            <Skeleton key={index} className="h-6 w-1/2" /> // Available years placeholders
                        ))}
                    </div>
                ) : (
                    <>
                        <h4>Available Years:</h4>
                        <ul className="list-disc pl-5">
                            {allYears.map((yr) => (
                                <li key={yr}>{yr}</li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            <TooltipProvider>
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-8 w-full" />
                            ))}
                    </div>
                ) : (
                    <DataTable 
                        data={visitData} 
                        columns={columns}
                        year={year || 0} 
                        primarySortColumn="points"
                        primarySortDesc={true}
                        transformToAggregatedView={transformVisitDataToCumulative}
                        filterConfig={{ 
                            dateField: 'visitDate'
                        }}
                        filename={`strakataturistika_vysledky_${year}`}
                        enableDownload={true}
                        enableAggregatedView={true}
                        aggregatedViewLabel="Cumulative View"
                        detailedViewLabel="Detailed View"
                        enableColumnVisibility={true}
                        enableSearch={true}
                        excludedColumnsInAggregatedView={['visitDate', 'dogNotAllowed', 'routeLink']}
                        mainSheetName="Detailní Data"
                        summarySheetName="Kumulativní Data"
                        generateSummarySheet={true}
                        summaryColumnDefinitions={[
                            { header: 'Jméno', key: 'fullName', width: 25 },
                            { header: 'Celkové Body', key: 'points', width: 15 },
                            { header: 'Navštívená místa', key: 'visitedPlaces', width: 50 }
                        ]}
                    />
                )}
            </TooltipProvider>
        </CommonPageTemplate>
    );
};

export default Page;