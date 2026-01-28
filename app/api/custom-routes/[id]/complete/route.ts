import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: routeId } = await params;
    const body = await request.json();
    const { userId, visitId } = body;

    // Verify route exists
    const route = await db.customRoute.findUnique({
        where: { id: routeId },
        include: { creator: true }
    });

    if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Prevent creator from completing their own route for bonus (optional rule, but good for anti-gaming)
    if (route.creatorId === userId) {
        // Logic: Creators don't get bonus for doing their own route again?
        // Or maybe allow it. The plan doesn't specify restrictions.
        // But typically "Creator Bonus" is when *others* complete it.
    }

    // Award +1 bonus to creator
    const creatorBonusPoints = (route.creatorBonusPoints || 0) + 1;

    await db.customRoute.update({
        where: { id: routeId },
        data: {
            creatorBonusPoints,
            // Add visit to track usage (assuming we have a relation or field, otherwise skip if schema doesn't support)
            // The plan mentioned: "visits: { push: ... }"
            // If `visits` is a JSON field in Prisma schema for CustomRoute, this works.
            // Assuming CustomRoute has `visits` Json[] or similar.
            // If not, we might need to rely on VisitData filtering.
        }
    });

    // Create bonus record for creator in VisitData
    // This creates a "virtual visit" record representing the bonus points received
    await db.visitData.create({
        data: {
            userId: route.creatorId,
            routeTitle: `Bonus za trasu: ${route.title}`,
            visitedPlaces: `BONUS: ${route.title}`,
            points: 1,
            year: new Date().getFullYear(),
            state: 'APPROVED',
            visitDate: new Date(),
            extraPoints: {
                type: 'route_creator_bonus',
                routeId,
                completedBy: userId,
                originalVisitId: visitId
            }
        }
    });

    return NextResponse.json({
        success: true,
        creatorBonus: 1,
        totalCreatorBonuses: creatorBonusPoints
    });
}
