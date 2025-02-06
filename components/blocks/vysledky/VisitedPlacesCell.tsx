import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { AiOutlineEnvironment } from 'react-icons/ai';

type VisitedPlacesCellProps = {
    visitedPlaces: string;
};

export const VisitedPlacesCell: React.FC<VisitedPlacesCellProps> = ({ visitedPlaces }) => {
    // Parse the visited places into an array
    const placesArray = visitedPlaces
        ?.split(',')
        .map((place) => place.trim())
        .filter((place) => place !== ''); // Exclude empty strings

    // State for "Show More/Show Less" in default mode
    const [showAll, setShowAll] = useState(false);

    // Determine which places to show based on the state
    const visiblePlaces = showAll ? placesArray : placesArray.slice(0, 5);

    return (
        <div>
            {/* For larger screens, display badges */}
            <div className="hidden sm:flex flex-col space-y-1">
                <div className="flex flex-wrap gap-2">
                    {/* Render each badge for visible places */}
                    {visiblePlaces.map((place, index) => (
                        <Badge
                            key={index}
                            variant="outline"
                            className="cursor-pointer w-fit"
                            onClick={() => {
                                // Open Google Search for the clicked place
                                const searchQuery = encodeURIComponent(place);
                                window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
                            }}
                        >
                            {place}
                        </Badge>
                    ))}

                    {/* Add "Show More/Show Less" badge at the end */}
                    {placesArray.length > 5 && (
                        <Badge
                            variant={showAll ? 'default' : 'secondary'}
                            className="cursor-pointer w-fit"
                            onClick={() => setShowAll(!showAll)} // Toggle the showAll state
                        >
                            {showAll
                                ? 'Zobrazit méně' // Show Less text
                                : `Zobrazit dalších ${placesArray.length - 5} míst`}
                        </Badge>
                    )}
                </div>
            </div>

            {/* For smaller screens, display an icon with a dialog */}
            <div className="sm:hidden">
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
                            <AiOutlineEnvironment size={24} />
                        </button>
                    </DialogTrigger>

                    <DialogContent
                        className="sm:max-w-md w-[95%] h-[60%] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-auto p-4 rounded-lg shadow-lg bg-white"
                    >
                        <DialogHeader>
                            <DialogTitle>Navštívená místa</DialogTitle>
                            <DialogClose />
                        </DialogHeader>
                        <div className="flex flex-wrap gap-2">
                            {placesArray.map((place, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="cursor-pointer w-fit"
                                    onClick={() => {
                                        // Open Google Search for the clicked place
                                        const searchQuery = encodeURIComponent(place);
                                        window.open(
                                            `https://www.google.com/search?q=${searchQuery}`,
                                            '_blank'
                                        );
                                    }}
                                >
                                    {place}
                                </Badge>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};