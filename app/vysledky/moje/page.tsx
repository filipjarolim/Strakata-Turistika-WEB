'use client';

import React, { useEffect } from 'react';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { User, ChevronLeft } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MojeClient from './moje-client';


export default function MojeVysledkyPage() {
    const user = useCurrentUser();
    const role = useCurrentRole();
    const router = useRouter();
    
    // Redirect to login if not authenticated
    useEffect(() => {
        if (user === null) {
            router.push('/prihlaseni?callbackUrl=/vysledky/moje');
        }
    }, [user, router]);

    // If user is not authenticated, show loading or null instead of redirecting inside render
    if (user === null) {
        return null;
    }

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
                <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                            <Link 
                                href="/vysledky" 
                            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors"
                            >
                            <ChevronLeft className="h-4 w-4" /> Zpět na přehled sezón
                            </Link>
                        <div className="flex items-center gap-3">
                            <User className="h-8 w-8 text-primary" />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-primary">
                                    Moje výsledky
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {user?.name ? `Přehled výsledků pro ${user.name}` : 'Přehled vašich výsledků'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* New Moje Client Component */}
                <MojeClient />
            </div>
        </CommonPageTemplate>
    );
} 