import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type tParams = Promise<{ rok: string }>;

// Cache expiration time (2 minutes)
const CACHE_TTL = 2 * 60 * 1000;
const resultsCache = new Map();

export async function GET(request: Request, { params }: { params: tParams }) {
    const { rok } = await params;
    const url = new URL(request.url);

    // Parse sorting parameters
    const sortField = url.searchParams.get('sortField') || 'visitDate';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    try {
        const year = parseInt(rok);

        if (isNaN(year)) {
            return NextResponse.json(
                { message: "Invalid year parameter." },
                { status: 400 }
            );
        }

        // First check if season exists
        const seasonExists = await db.season.findUnique({
            where: { year },
            select: { id: true }
        });

        if (!seasonExists) {
            return NextResponse.json(
                { message: `Pro rok ${year} nebyla nalezena žádná data` },
                { status: 404 }
            );
        }

        // Get all data for the year
        const visitData = await db.visitData.findMany({
            where: { year },
            orderBy: {
                [sortField]: sortOrder
            },
            select: {
                id: true,
                visitDate: true,
                routeTitle: true,
                routeDescription: true,
                dogName: true,
                points: true,
                visitedPlaces: true,
                dogNotAllowed: true,
                routeLink: true,
                route: true,
                year: true,
                extraPoints: true,
                state: true,
                rejectionReason: true,
                createdAt: true,
                photos: true,
                user: {
                    select: {
                        name: true,
                        dogName: true
                    }
                }
            }
        });

        return NextResponse.json({
            data: visitData,
            pagination: {
                totalItems: visitData.length,
                totalPages: 1,
                currentPage: 1,
                pageSize: visitData.length,
                hasNextPage: false,
                hasPreviousPage: false
            }
        });
    } catch (error) {
        console.error("[GET_VISIT_DATA_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch visit data." },
            { status: 500 }
        );
    }
}