import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        // Fetch all unique years from the Season model
        const seasons = await db.season.findMany({
            select: { year: true },
            orderBy: { year: 'asc' },
        });

        const years = seasons.map(season => season.year);

        return NextResponse.json(years);
    } catch (error) {
        console.error('[GET_SEASONS_ERROR]', error);
        return NextResponse.json(
            { message: 'Failed to fetch seasons (years).' },
            { status: 500 }
        );
    }
}