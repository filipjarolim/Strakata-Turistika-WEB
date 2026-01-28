'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Database } from 'lucide-react';
import AdminClient from './admin-client';
import { AdminPageTemplate } from '@/components/admin/AdminPageTemplate';

export default function CollectionPage() {
    const params = useParams();
    const collection = params.collection as string;

    if (!collection) {
        return (
            <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-red-500">Neplatná kolekce</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Zadaná kolekce není platná.</p>
            </div>
        );
    }

    return <AdminClient key={collection} />;
}
