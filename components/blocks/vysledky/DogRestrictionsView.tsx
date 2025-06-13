import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PawPrint } from 'lucide-react';
import { VisitData } from './DataTable';

interface DogRestrictionsViewProps {
    data: VisitData[];
}

export const DogRestrictionsView = ({ data }: DogRestrictionsViewProps) => {
    const restrictedPlaces = data
        .filter(visit => visit.dogNotAllowed)
        .reduce((acc, visit) => {
            if (visit.dogNotAllowed && visit.visitedPlaces) {
                acc.add(visit.visitedPlaces);
            }
            return acc;
        }, new Set<string>());

    return (
        <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Místa s omezením pro psy</h3>
                </div>
            </CardHeader>
            <CardContent>
                {restrictedPlaces.size > 0 ? (
                    <ScrollArea className="h-[300px] pr-4">
                        <ul className="space-y-3">
                            {Array.from(restrictedPlaces).map((place, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{place}</span>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                ) : (
                    <p className="text-muted-foreground">
                        Pro tento rok nejsou evidována žádná místa s omezením pro psy.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};
