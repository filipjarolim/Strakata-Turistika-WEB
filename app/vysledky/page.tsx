'use client';

import React, { useEffect, useState } from 'react';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import Link from 'next/link';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';

export default function SeasonsPage() {
    const [years, setYears] = useState<number[]>([]);
    const [filteredYears, setFilteredYears] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const user = useCurrentUser();
    const role = useCurrentRole();

    useEffect(() => {
        async function fetchSeasons() {
            setIsLoading(true);
            try {
                const res = await fetch('/api/seasons');
                if (!res.ok) throw new Error('Nepodařilo se načíst sezóny.');
                const data: number[] = await res.json();
                setYears(data);
                setFilteredYears(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Došlo k neočekávané chybě.');
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchSeasons();
    }, []);

    function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value.trim();
        if (!query) {
            setFilteredYears(years);
        } else {
            setFilteredYears(
                years.filter((year) => year.toString().includes(query))
            );
        }
    }

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={user} currentRole={role}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <h1 className="text-4xl font-bold text-black/70">Sezóny</h1>

                {/* Search Input */}
                <Input
                    placeholder="Hledat podle roku..."
                    onChange={handleSearch}
                    className="w-full max-w-md"
                />

                {/* Render Loading State / Error */}
                {isLoading && (
                    <div className="flex justify-center items-center mt-10">
                        <motion.div
                            className="bg-gray-200 rounded-full w-10 h-10"
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [1, 0.8, 1],
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                repeatType: 'loop',
                            }}
                        />
                        <span className="ml-3 text-xl text-gray-600">Načítání...</span>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive" className="max-w-md mx-auto">
                        <span>{error}</span>
                    </Alert>
                )}

                {!isLoading && !error && (
                    <>
                        {/* Render Seasons as Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredYears.map((year) => (
                                <motion.div
                                    key={year}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="shadow-md hover:shadow-lg transition-transform"
                                >
                                    <Link href={`/vysledky/${year}`}>
                                        <Card>
                                            <CardHeader className="flex items-center space-x-2">
                                                <CalendarDays className="w-5 h-5 text-primary" />
                                                <h2 className="text-lg font-semibold">{year}</h2>
                                            </CardHeader>
                                            <CardContent className="text-sm text-gray-600">
                                                Zobrazit výsledky z roku {year}
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </CommonPageTemplate>
    );
}