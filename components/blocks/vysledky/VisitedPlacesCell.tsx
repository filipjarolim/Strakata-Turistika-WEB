'use client';

import React, { useMemo, useState } from 'react';
import { IOSBadge } from '@/components/ui/ios/badge';
import { IOSTextInput } from '@/components/ui/ios/text-input';
import { IOSSlidePanel } from '@/components/ui/ios/slide-panel';
import { IOSButton } from '@/components/ui/ios/button';
import { Search, X, MapPin, ExternalLink, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitedPlacesCellProps {
    visitedPlaces: string;
}

export const VisitedPlacesCell = ({
    visitedPlaces
}: VisitedPlacesCellProps) => {
    // Parse the visited places into an array
    const placesArray = useMemo(() => {
        return visitedPlaces
            ?.split(',')
            .map((place) => place.trim())
            .filter((place) => place !== '') || []; // Exclude empty strings
    }, [visitedPlaces]);

    // State for panel and search
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Handling when to show the panel vs the inline display
    const totalPlaces = placesArray.length;
    const displayInlinePlaces = totalPlaces > 0 ? placesArray.slice(0, 2) : [];
    const hasMorePlaces = totalPlaces > 2;
    const remainingCount = totalPlaces - displayInlinePlaces.length;

    // Filter places based on search query
    const filteredPlaces = useMemo(() => {
        if (!searchQuery) return placesArray;
        return placesArray.filter(place => 
            place.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [placesArray, searchQuery]);

    // Opening external search in a new tab
    const handlePlaceClick = (place: string, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const searchQuery = encodeURIComponent(place);
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
    };

    if (totalPlaces === 0) {
        return <span className="text-gray-500">—</span>;
    }

    return (
        <div className="flex flex-wrap items-center gap-1">
            {displayInlinePlaces.map((place, index) => (
                <IOSBadge
                    key={index}
                    label={place}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => handlePlaceClick(place, e)}
                    className="cursor-pointer hover:bg-blue-50"
                    bgColor="bg-blue-100"
                    textColor="text-blue-900"
                    borderColor="border-blue-200"
                />
            ))}

            {hasMorePlaces && (
                <>
                    <IOSBadge
                        label={`+${remainingCount}`}
                        onClick={() => setIsOpen(true)}
                        className="cursor-pointer"
                        bgColor="bg-gray-100"
                        textColor="text-gray-900"
                        borderColor="border-gray-200"
                        icon={<Plus className="h-3 w-3" />}
                    />

                    <IOSSlidePanel
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        side="right"
                        className="bg-white/80 backdrop-blur-lg border-l"
                    >
                        <div className="p-4 border-b bg-white/50">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Navštívená místa ({totalPlaces})
                                </h2>
                            </div>
                            
                            <div className="mt-4 relative">
                                <IOSTextInput
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Hledat místo..."
                                    className="pl-10"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                {searchQuery && (
                                    <button 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4 space-y-2 h-[calc(100vh-200px)] overflow-y-auto">
                            {filteredPlaces.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    Nenalezena žádná místa pro &quot;{searchQuery}&quot;
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredPlaces.map((place, index) => (
                                        <IOSBadge
                                            key={index}
                                            label={place}
                                            onClick={(e: React.MouseEvent<HTMLDivElement>) => handlePlaceClick(place, e)}
                                            className={cn(
                                                "cursor-pointer p-2 hover:bg-blue-50",
                                                index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                            )}
                                            bgColor="bg-transparent"
                                            textColor="text-gray-900"
                                            borderColor="border-gray-200"
                                            icon={<ExternalLink className="h-3 w-3" />}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t">
                            <IOSButton
                                onClick={() => setIsOpen(false)}
                                className="w-full"
                            >
                                Zavřít
                            </IOSButton>
                        </div>
                    </IOSSlidePanel>
                </>
            )}
        </div>
    );
};