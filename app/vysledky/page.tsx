'use client';

import React, { useEffect, useState } from 'react';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrentRole } from '@/hooks/use-current-role';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { CalendarDays, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import VysledkyImage from '@/assets/img/vysledkyimage.png';

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
                
                // Sort years in descending order (newest first)
                const sortedYears = [...data].sort((a, b) => b - a);
                setYears(sortedYears);
                setFilteredYears(sortedYears);

                
                localStorage.setItem('cachedSeasons', JSON.stringify(sortedYears));
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Došlo k neočekávané chybě.');
                }

                
                const cachedData = localStorage.getItem('cachedSeasons');
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    setYears(parsedData);
                    setFilteredYears(parsedData);
                    setError('');
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

    // Animation variants for staggered card appearance
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };
    
    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <CommonPageTemplate contents={{ header: true }} headerMode={"auto-hide"} currentUser={user} currentRole={role}>
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">Výsledky dle sezón</h1>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1">Vyberte rok pro zobrazení výsledků</p>
                    </div>
                    
                    <div className="relative w-full sm:w-auto lg:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Hledat podle roku..."
                            onChange={handleSearch}
                            className="pl-10 w-full text-sm sm:text-base"
                        />
                  
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="my-4">
                        <AlertTitle>Chyba</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <ScrollArea className="h-[350px] sm:h-[400px]">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="h-32 sm:h-36">
                                    <Skeleton className="w-full h-full rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6"
                            variants={container}
                            initial="hidden"
                            animate="show"
                        >
                            {filteredYears.length > 0 ? (
                                filteredYears.map((year, index) => (
                                    <motion.div
                                        key={year}
                                        variants={item}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="transition-all duration-300"
                                    >
                                        <Link href={`/vysledky/${year}`} className="h-full">
                                            <Card className="h-full border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300">
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                                                    <div className="flex items-center space-x-2">
                                                        <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                                        <h2 className="text-lg sm:text-xl font-bold">{year}</h2>
                                                    </div>
                                                    {year === new Date().getFullYear() && (
                                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs sm:text-sm">
                                                            <span className="hidden sm:inline">Aktuální</span>
                                                            <span className="sm:hidden">Now</span>
                                                        </Badge>
                                                    )}
                                                </CardHeader>
                                                <CardContent className="p-3 sm:p-6 pt-0">
                                                    <p className="text-sm sm:text-base text-muted-foreground">
                                                        <span className="hidden sm:inline">Výsledky turistické sezóny {year}</span>
                                                        <span className="sm:hidden">Sezóna {year}</span>
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 sm:py-10 px-4">
                                    <h3 className="text-base sm:text-lg font-medium">Žádné výsledky</h3>
                                    <p className="text-sm sm:text-base text-muted-foreground mt-1">Pro zadaný rok nebyly nalezeny žádné výsledky</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </ScrollArea>

                <p className="text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 text-center sm:text-left">
                            Hledáte své výsledky? <Link href="/vysledky/moje" className="text-primary hover:underline">Přejít na můj profil</Link>
                </p>
            </div>
                  
            <Image src={VysledkyImage} alt="Strakatá turistika" className={"w-[200px] sm:w-[250px] pointer-events-none fixed bottom-[-40px] sm:bottom-[-60px] right-[2%] sm:right-[8%] hidden sm:block"}/>
            
        </CommonPageTemplate>
    );
}
