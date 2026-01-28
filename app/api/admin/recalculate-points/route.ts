import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { calculatePoints, type Place } from '@/lib/scoring-utils';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
    const user = await currentUser();

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { visitId } = body;

        // Fetch active scoring config
        const dbConfig = await db.scoringConfig.findFirst({ where: { active: true } });
        if (!dbConfig) {
            return NextResponse.json({ error: 'Active scoring config not found' }, { status: 500 });
        }

        const scoringConfig = {
            pointsPerKm: dbConfig.pointsPerKm,
            minDistanceKm: dbConfig.minDistanceKm,
            requireAtLeastOnePlace: dbConfig.requireAtLeastOnePlace,
            placeTypePoints: dbConfig.placeTypePoints as Record<string, number>
        };

        // Fetch visits to recalculate
        const where: Prisma.VisitDataWhereInput = {};

        if (visitId) {
            where.id = visitId;
        } else {
            // Only allow bulk recalculation if explicitly requested or for small sets
            // Default to current year approved if no ID provided (legacy support)
            // But we add a safety check or better yet, only do current year if explicitly asked for bulk
            const currentYear = new Date().getFullYear();
            where.year = currentYear;
            where.state = 'APPROVED';
        }

        const visits = await db.visitData.findMany({ where });

        if (visits.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No visits found to recalculate' });
        }

        let updatedCount = 0;

        for (const visit of visits) {
            // Skip creator bonuses or other virtual visits if they shouldn't be recalculated
            const extra = (visit.extraPoints as unknown) as Record<string, unknown>;
            if (extra?.type === 'route_creator_bonus') continue;

            const places = ((visit.places as unknown) as Place[]) || [];
            const routeDataRaw = (visit.route as unknown) as Record<string, unknown>;

            // Re-calculate
            const result = calculatePoints({
                trackPoints: (routeDataRaw?.trackPoints as Array<Record<string, unknown>>)?.map((p) => ({
                    latitude: (p.latitude || p.lat) as number,
                    longitude: (p.longitude || p.lng) as number
                })) || [],
                totalDistance: routeDataRaw?.totalDistance as number | undefined,
                duration: routeDataRaw?.duration as number | undefined,
                source: routeDataRaw?.source as "manual" | "gps_tracking" | "gpx_upload" | "screenshot" | undefined
            }, places, scoringConfig);

            // Update visit
            await db.visitData.update({
                where: { id: visit.id },
                data: {
                    points: result.totalPoints,
                    extraPoints: {
                        ...(visit.extraPoints as Record<string, unknown>),
                        ...result,
                        recalculatedAt: new Date().toISOString()
                    } as unknown as Prisma.InputJsonValue
                }
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            count: updatedCount
        });
    } catch (error) {
        console.error('Recalculate points failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
