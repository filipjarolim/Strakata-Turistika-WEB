'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import ResultsClient from './results-client';
import VysledkyImage from '@/assets/img/vysledkyimage.png';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, CalendarDays } from 'lucide-react';

export default function SeasonResultsPage() {
    const params = useParams();
    const year = parseInt(params.rok as string);
    const user = useCurrentUser();
    const role = useCurrentRole();

    if (isNaN(year)) {
        return (
            <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Neplatný rok</h1>
                    <p className="text-gray-600 mt-2">Zadaný rok není platný.</p>
                </div>
            </CommonPageTemplate>
        );
    }

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
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
                        </div>
                    </div>
                </div>

                {/* New Results Client Component */}
                <ResultsClient key={year} />
                
                <Image 
                    src={VysledkyImage} 
                    alt="Strakatá turistika" 
                    className="w-[200px] sm:w-[250px] pointer-events-none fixed bottom-[-40px] sm:bottom-[-60px] right-[2%] sm:right-[8%] hidden sm:block"
                />
            </div>
        </CommonPageTemplate>
    );
}