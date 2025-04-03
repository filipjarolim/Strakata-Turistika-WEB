import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

type tParams = Promise<{ year: string }>;

// Cache expiration time (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const userYearResultsCache = new Map();

// Define interfaces for our data
interface ExtraPoints {
    userId?: string;
    reason?: string;
    amount?: number;
    [key: string]: unknown;
}

export async function GET(request: Request, { params }: { params: tParams }) {
    try {
        // Get the current authenticated user
        const user = await currentUser();
        
        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        const { year } = await params;
        const yearNum = parseInt(year);

        if (isNaN(yearNum)) {
            return NextResponse.json(
                { message: "Invalid year parameter." },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = `user_results_${user.id}_${yearNum}`;
        const cachedData = userYearResultsCache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
            // If cached data exists and is not expired, use it
            return NextResponse.json(cachedData.data);
        }

        // Optimize by directly checking the season collection first
        const seasonExists = await db.season.findUnique({
            where: { year: yearNum },
            select: { id: true }
        });

        if (!seasonExists) {
            // If season doesn't exist, return empty results immediately
            return NextResponse.json([]);
        }

        // Only select needed fields to improve query performance
        const yearVisitData = await db.visitData.findMany({
            where: {
                year: yearNum
            },
            select: {
                id: true,
                visitDate: true,
                fullName: true,
                dogName: true,
                points: true,
                visitedPlaces: true,
                dogNotAllowed: true,
                routeLink: true,
                year: true,
                extraPoints: true
            },
            orderBy: { visitDate: 'desc' }
        });

        // Create a more efficient filter - first check if we can filter by name
        // as it's faster than parsing JSON
        let userYearVisitData = [];
        
        if (user.name) {
            // First pass - filter by name (faster)
            userYearVisitData = yearVisitData.filter(item => item.fullName === user.name);
        }
        
        // If we have no name matches or user has no name, also check the extraPoints.userId
        if (userYearVisitData.length === 0 || !user.name) {
            // Second pass - filter by extraPoints.userId
            userYearVisitData = yearVisitData.filter(item => {
                try {
                    // Parse extraPoints as our defined type instead of any
                    const extraPoints = item.extraPoints as ExtraPoints;
                    return extraPoints && extraPoints.userId === user.id;
                } catch (e) {
                    return false;
                }
            });
        }

        // Store in cache
        userYearResultsCache.set(cacheKey, {
            data: userYearVisitData,
            timestamp: Date.now()
        });

        return NextResponse.json(userYearVisitData);
    } catch (error) {
        console.error("[GET_USER_YEAR_RESULTS_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch user results for the specified year." },
            { status: 500 }
        );
    }
} 