'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/blocks/vysledky/DataTable';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import {useCurrentUser} from "@/hooks/use-current-user";
import {useCurrentRole} from "@/hooks/use-current-role";

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

    useEffect(() => {
        const fetchVisitData = async () => {
            const { rok } = await params;
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
            <h1 className="text-2xl font-bold mb-4">Výsledky</h1>

            <Tabs defaultValue="detailed" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="detailed">Podrobné výsledky</TabsTrigger>
                    <TabsTrigger value="work">Práce na vývoji</TabsTrigger>
                </TabsList>
                <TabsContent value="detailed" className="w-[95%] mx-auto">
                    <DataTable data={visitData} />
                </TabsContent>
                <TabsContent value="work">
                    <p>Práce na vývoji</p>
                </TabsContent>
            </Tabs>
        </CommonPageTemplate>
    );
};

export default Page;