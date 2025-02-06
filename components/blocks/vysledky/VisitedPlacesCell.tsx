import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

type VisitedPlacesCellProps = {
    visitedPlaces: string;
};

export const VisitedPlacesCell: React.FC<VisitedPlacesCellProps> = ({ visitedPlaces }) => {
    // Parse the visited places into an array
    const placesArray = visitedPlaces
        ?.split(',')
        .map((place) => place.trim())
        .filter((place) => place !== ''); // Exclude empty strings

    // State for "Show More/Show Less"
    const [showAll, setShowAll] = useState(false);

    // Determine which places to show based on the state
    const visiblePlaces = showAll ? placesArray : placesArray.slice(0, 5);

    return (
        <div className="flex flex-col space-y-1">
            <div className="flex flex-wrap gap-2">
                {/* Render each badge for visible places */}
                {visiblePlaces.map((place, index) => (
                    <Badge
                        key={index}
                        variant="outline"
                        className="cursor-pointer"
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
                        className="cursor-pointer"
                        onClick={() => setShowAll(!showAll)} // Toggle the showAll state
                    >
                        {showAll
                            ? 'Zobrazit méně' // Show Less text
                            : `Zobrazit dalších ${placesArray.length - 5} míst`}
                    </Badge>
                )}
            </div>
        </div>
    );
};