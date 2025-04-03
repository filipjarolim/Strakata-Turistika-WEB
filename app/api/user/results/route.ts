import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

type JsonValue = Prisma.JsonValue;

// Cache expiration time (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const userResultsCache = new Map();

// Define interfaces for our data
interface ExtraPoints {
    userId?: string;
    reason?: string;
    amount?: number;
    [key: string]: unknown;
}

interface VisitData {
    id: string;
    visitDate: Date | null;
    fullName: string;
    dogName: string | null;
    points: number;
    visitedPlaces: string;
    dogNotAllowed: boolean | null;
    routeLink: string | null;
    year: number;
    extraPoints: JsonValue;
}

export async function GET() {
    try {
        // Get the current authenticated user
        const user = await currentUser();
        
        if (!user) {
            return NextResponse.json(
                { message: "Unauthorized. Please log in." },
                { status: 401 }
            );
        }

        // Check cache first
        const cacheKey = `user_results_${user.id}`;
        const cachedData = userResultsCache.get(cacheKey);
        
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
            // If cached data exists and is not expired, use it
            return NextResponse.json(cachedData.data);
        }

        // Only select the fields we actually need to improve query performance
        const allVisitData = await db.visitData.findMany({
            orderBy: { visitDate: 'desc' },
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
            }
        }) as VisitData[];

        // Create a more efficient filter - first check if we can filter by name
        let userVisitData: VisitData[] = [];
        
        if (user.name) {
            // First pass - filter by name (faster)
            userVisitData = allVisitData.filter(item => item.fullName === user.name);
        }
        
        // If we have no name matches or user has no name, also check the extraPoints.userId
        if (userVisitData.length === 0 || !user.name) {
            // Second pass - filter by extraPoints.userId
            userVisitData = allVisitData.filter(item => {
                try {
                    // Parse extraPoints as our defined type instead of any
                    const extraPoints = item.extraPoints as ExtraPoints;
                    return extraPoints && extraPoints.userId === user.id;
                } catch (e) {
                    return false;
                }
            });
        }

        // In the future, once schema is updated:
        // const userVisitData = await db.visitData.findMany({
        //     where: { userId: user.id },
        //     orderBy: { visitDate: 'desc' }
        // });

        // Store in cache
        userResultsCache.set(cacheKey, {
            data: userVisitData,
            timestamp: Date.now()
        });

        return NextResponse.json(userVisitData);
    } catch (error) {
        console.error("[GET_USER_RESULTS_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch user results." },
            { status: 500 }
        );
    }
} 