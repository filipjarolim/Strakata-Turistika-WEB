'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Database } from 'lucide-react';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import AdminClient from './admin-client';

export default function CollectionPage() {
    const params = useParams();
    const collection = params.collection as string;
    const user = useCurrentUser();
    const role = useCurrentRole();

    if (!collection) {
        return (
            <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600">Neplatná kolekce</h1>
                    <p className="text-gray-600 mt-2">Zadaná kolekce není platná.</p>
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
                            href="/admin" 
                            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" /> Zpět na admin dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <Database className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-primary">
                                    {collection}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Správa záznamů kolekce
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Client Component */}
                <AdminClient key={collection} />
            </div>
        </CommonPageTemplate>
    );
}
