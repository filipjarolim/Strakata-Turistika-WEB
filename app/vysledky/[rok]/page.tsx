'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/blocks/vysledky/DataTable';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import {useCurrentUser} from "@/hooks/use-current-user";
import {useCurrentRole} from "@/hooks/use-current-role";
import { TooltipProvider } from "@/components/ui/tooltip";

type VisitData = {
    id: string;
    visitDate?: string | null;
    fullName: string;
    dogName?: string | null;
    points: number;
    visitedPlaces: string;
    dogNotAllowed?: string | null;
    routeLink?: string | null;
    year: number;
};

const Page = ({ params }: { params: Promise<{ rok: string }> }) => {
    const [visitData, setVisitData] = useState<VisitData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const user = useCurrentUser();
    const role = useCurrentRole();
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        const fetchVisitData = async () => {
            const { rok } = await params;
            setYear(parseInt(rok));
            const res = await fetch(`/api/results/${rok}`);
            const data: VisitData[] = await res.json();
            setVisitData(data);
            setLoading(false);
        };

        fetchVisitData();
    }, [params]);

    if (loading) {
        return <p>Načítání...</p>;
    }

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="text-4xl font-bold mb-4 text-black/70 pt-4">
                Výsledky z roku
                {" "}
                <span className={"font-bold text-5xl text-black"}>
                    {year}
                </span>
            </div>
            <TooltipProvider>
                <DataTable data={visitData} year={year?year:0} />
            </TooltipProvider>

        </CommonPageTemplate>
    );
};

export default Page;