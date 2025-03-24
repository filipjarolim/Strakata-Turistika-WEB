import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, ExternalLink, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';

type VisitedPlacesCellProps = {
    visitedPlaces: string;
};

export const VisitedPlacesCell: React.FC<VisitedPlacesCellProps> = ({ visitedPlaces }) => {
    // Parse the visited places into an array
    const placesArray = visitedPlaces
        ?.split(',')
        .map((place) => place.trim())
        .filter((place) => place !== '') || []; // Exclude empty strings

    // State for dialog and search
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Handling when to show the dialog vs the inline display
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
    const handlePlaceClick = (place: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const searchQuery = encodeURIComponent(place);
        window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
        // Don't close dialog to allow exploring multiple places
    }

    if (totalPlaces === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <div className="flex items-center gap-1 max-w-xs">
            {/* Show first 2 places inline */}
            <div className="flex flex-nowrap overflow-hidden gap-1">
                {displayInlinePlaces.map((place, index) => (
                    <Tooltip key={index} delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Badge
                                variant="outline"
                                className="whitespace-nowrap overflow-hidden text-ellipsis max-w-32 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
                                onClick={(e) => handlePlaceClick(place, e)}
                            >
                                {place}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs bg-popover/95 backdrop-blur-sm p-3 text-xs">
                            {place}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* Show "+X more" badge if there are more places */}
            {hasMorePlaces && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Badge 
                            variant="secondary" 
                            className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            {remainingCount}
                        </Badge>
                    </DialogTrigger>
                    
                    <DialogContent className="sm:max-w-md max-h-[80vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl mb-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                <span>Navštívená místa ({totalPlaces})</span>
                            </DialogTitle>
                            
                            {/* Search input for places */}
                            <div className="relative mt-2">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Hledat místo..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-8"
                                />
                                {searchQuery && (
                                    <button 
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </DialogHeader>
                        
                        <div className="mt-4 h-[50vh] sm:h-[40vh] overflow-y-auto pr-1 pb-2">
                            {filteredPlaces.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenalezena žádná místa pro "{searchQuery}"
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredPlaces.map((place, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer p-2 flex items-center justify-between gap-1 hover:bg-primary/10 hover:border-primary/30 transition-colors",
                                                index % 2 === 0 ? "bg-muted/30" : "bg-transparent"
                                            )}
                                            onClick={(e) => handlePlaceClick(place, e)}
                                        >
                                            <span className="truncate">{place}</span>
                                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                size="sm" 
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Zavřít
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};