// Script to calculate website statistics directly from database
// Run this once to get the data, then manually fill the stats section

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const calculateStats = async () => {
    try {
        // Get all visit data
        const visitData = await prisma.visitData.findMany();
        
        console.log(`Total visit records: ${visitData.length}`);
        
        // Debug: Check the structure of extraPoints
        if (visitData.length > 0) {
            console.log('Sample extraPoints structure:', JSON.stringify(visitData[0].extraPoints, null, 2));
        }
        
        // Calculate unique users across all seasons
        const uniqueUsers = new Set();
        visitData.forEach(visit => {
            if (visit.extraPoints && visit.extraPoints["Příjmení a jméno"]) {
                uniqueUsers.add(visit.extraPoints["Příjmení a jméno"]);
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
        
        // Get total users
        const totalUsers = await prisma.user.count();
        
        console.log('=== WEBSITE STATISTICS ===');
        console.log(`Total unique users across all seasons: ${uniqueUsers.size}`);
        console.log(`Total places visited across all seasons: ${totalPlaces}`);
        console.log(`Total seasons: ${uniqueSeasons.size}`);
        console.log(`Total points: ${totalPoints}`);
        console.log(`Total registered users: ${totalUsers}`);
        console.log('========================');
        
        return {
            uniqueUsers: uniqueUsers.size,
            totalPlaces: totalPlaces,
            totalSeasons: uniqueSeasons.size,
            totalPoints: totalPoints,
            totalUsers: totalUsers
        };
        
    } catch (error) {
        console.error('Error calculating stats:', error);
        return {
            uniqueUsers: 0,
            totalPlaces: 0,
            totalSeasons: 0,
            totalPoints: 0,
            totalUsers: 0
        };
    } finally {
        await prisma.$disconnect();
    }
};

// Run the calculation
calculateStats().then(stats => {
    console.log('Final stats object:', stats);
    console.log('Copy this data to fill the stats section manually');
}); 