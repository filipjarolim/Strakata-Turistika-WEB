import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const currentMonth = format(new Date(), 'yyyy-MM');
    const currentMonthInt = parseInt(format(new Date(), 'M'));

    // CustomRoute doesn't have createdMonth, so we might need to rely on createdAt
    // Or check if createdMonth field exists in schema.
    // Assuming the schema has createdMonth based on the plan, or we query by createdAt date range.

    // Let's check using createdAt first as it's safer standard
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const routeThisMonth = await db.customRoute.findFirst({
        where: {
            creatorId: userId,
            createdAt: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        }
    });

    return NextResponse.json({
        hasCreatedThisMonth: !!routeThisMonth,
        currentMonth
    });
}
