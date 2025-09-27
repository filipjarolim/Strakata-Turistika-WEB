// Script to calculate website statistics
// Run this once to get the data, then manually fill the stats section

const calculateStats = async () => {
    try {
        // Fetch all visit data from all seasons
        const visitDataResponse = await fetch('http://localhost:3000/api/visitData');
        
        if (!visitDataResponse.ok) {
            throw new Error(`HTTP error! status: ${visitDataResponse.status}`);
        }
        
        const visitData = await visitDataResponse.json();
        
        console.log('Raw visit data:', visitData);
        
        // Calculate unique users across all seasons
        const uniqueUsers = new Set();
        visitData.forEach(visit => {
            if (visit.userId) {
                uniqueUsers.add(visit.userId);
            }
        });
        
        // Calculate total places visited
        const totalPlaces = visitData.reduce((total, visit) => {
            if (visit.visitedPlaces) {
                // visitedPlaces is a string, so we need to parse it or count it differently
                // Assuming it's a comma-separated string of places
                const places = visit.visitedPlaces.split(',').filter(place => place.trim());
                return total + places.length;
            }
            return total;
        }, 0);
        
        // Calculate total seasons (from the year field)
        const uniqueSeasons = new Set();
        visitData.forEach(visit => {
            if (visit.year) {
                uniqueSeasons.add(visit.year);
            }
        });
        
        // Calculate total points
        const totalPoints = visitData.reduce((total, visit) => {
            return total + (visit.points || 0);
        }, 0);
        
        console.log('=== WEBSITE STATISTICS ===');
        console.log(`Total unique users across all seasons: ${uniqueUsers.size}`);
        console.log(`Total places visited across all seasons: ${totalPlaces}`);
        console.log(`Total seasons: ${uniqueSeasons.size}`);
        console.log(`Total points: ${totalPoints}`);
        console.log('========================');
        
        return {
            uniqueUsers: uniqueUsers.size,
            totalPlaces: totalPlaces,
            totalSeasons: uniqueSeasons.size,
            totalPoints: totalPoints
        };
        
    } catch (error) {
        console.error('Error calculating stats:', error);
        return {
            uniqueUsers: 0,
            totalPlaces: 0,
            totalSeasons: 0,
            totalPoints: 0
        };
    }
};

// Run the calculation
calculateStats().then(stats => {
    console.log('Final stats object:', stats);
    console.log('Copy this data to fill the stats section manually');
}); 