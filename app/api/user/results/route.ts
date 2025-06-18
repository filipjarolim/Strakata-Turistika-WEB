import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Cache expiration time (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const userResultsCache = new Map();

// Define the structure for the extraPoints field
interface ExtraPointsData {
    userId?: string;
    reason?: string;
    amount?: number;
    [key: string]: unknown;
}

// Define the visit data structure
interface VisitData {
    id: string;
    visitDate: Date | null;
    fullName: string | null;
    dogName: string | null;
    points: number | null;
    visitedPlaces: unknown;
    dogNotAllowed: boolean | null;
    routeLink: string | null;
    year: number | null;
    extraPoints: unknown;
}

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check cache first
        const cacheKey = `user_results_${user.id}`;
        const cachedData = userResultsCache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
            // If cached data exists and is not expired, use it
            return NextResponse.json(cachedData.data);
        }

        // Only select the fields we actually need to improve query performance
        const userVisitData = await db.visitData.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                visitDate: 'desc'
            },
            select: {
                id: true,
                visitDate: true,
                routeTitle: true,
                routeDescription: true,
                points: true,
                visitedPlaces: true,
                dogNotAllowed: true,
                routeLink: true,
                year: true,
                extraPoints: true,
                state: true,
                rejectionReason: true,
                createdAt: true
                }
        });

        // Store in cache
        userResultsCache.set(cacheKey, {
            data: userVisitData,
            timestamp: Date.now()
        });

        return NextResponse.json(userVisitData);
    } catch (error) {
        console.error("[GET_USER_RESULTS_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch results." },
            { status: 500 }
        );
    }
} 