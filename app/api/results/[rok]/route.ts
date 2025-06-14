import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type tParams = Promise<{ rok: string }>;

// Cache expiration time (2 minutes)
const CACHE_TTL = 2 * 60 * 1000;
const resultsCache = new Map();

export async function GET(request: Request, { params }: { params: tParams }) {
    const { rok } = await params;
    const url = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '100');
    const skipCount = (page - 1) * pageSize;

    try {
        const year = parseInt(rok);

        if (isNaN(year)) {
            return NextResponse.json(
                { message: "Invalid year parameter." },
                { status: 400 }
            );
        }
        
        // Generate cache key based on year and pagination
        const cacheKey = `results_${year}_page${page}_size${pageSize}`;
        const cachedData = resultsCache.get(cacheKey);
        
        // Return cached data if it exists and is not expired
        if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
            return NextResponse.json({
                data: cachedData.data,
                pagination: cachedData.pagination
            });
        }

        // First check if season exists to avoid unnecessary joins
        const seasonExists = await db.season.findUnique({
            where: { year },
            select: { id: true }
        });

        if (!seasonExists) {
            return NextResponse.json(
                { message: `No data found for year ${year}` },
                { status: 404 }
            );
        }
        
        // Get total count for pagination
        const totalCount = await db.visitData.count({
            where: { year }
        });
        
        // Get data with pagination and select only needed fields
        const visitData = await db.visitData.findMany({
            where: { year },
            orderBy: { visitDate: 'asc' },
            skip: skipCount,
            take: pageSize,
            select: {
                id: true,
                visitDate: true,
                points: true,
                visitedPlaces: true,
                dogNotAllowed: true,
                routeLink: true,
                year: true
                // Note: we don't select extraPoints unless needed
            }
        });
        
        // Create pagination object
        const pagination = {
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            pageSize: pageSize
        };
        
        // Cache the result
        resultsCache.set(cacheKey, {
            data: visitData,
            pagination: pagination,
            timestamp: Date.now()
        });

        return NextResponse.json({
            data: visitData,
            pagination: pagination
        });
    } catch (error) {
        console.error("[GET_VISIT_DATA_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch visit data." },
            { status: 500 }
        );
    }
}