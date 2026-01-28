import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(request: Request) {
    const user = await currentUser();

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const currentYear = new Date().getFullYear();
        const season = await db.season.findUnique({
            where: { year: currentYear }
        });

        if (!season) {
            return NextResponse.json({ error: 'Current season not found' }, { status: 404 });
        }

        const result = await db.visitData.updateMany({
            where: {
                year: currentYear,
                state: 'PENDING_REVIEW'
            },
            data: {
                state: 'APPROVED'
            }
        });

        return NextResponse.json({
            success: true,
            count: result.count
        });
    } catch (error) {
        console.error('Bulk approve failed:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
