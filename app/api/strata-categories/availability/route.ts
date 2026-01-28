import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkCategoryAvailability } from '@/lib/strata-trasa-utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const categories = await db.strataCategory.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
    });

    if (!userId) {
        // If no user, just return categories as available (or unavailable depending on logic)
        // Here returning them as available for viewing purposes
        return NextResponse.json(categories.map(c => ({ ...c, available: true, isFirstThisMonth: false })));
    }

    // Check each category's availability
    const enrichedCategories = await Promise.all(
        categories.map(async (cat) => {
            const status = await checkCategoryAvailability(userId, cat.id);
            return {
                ...cat,
                available: status.available,
                isFirstThisMonth: status.isFirstThisMonth || false
            };
        })
    );

    return NextResponse.json(enrichedCategories);
}
