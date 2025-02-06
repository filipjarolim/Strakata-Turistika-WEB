import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type tParams = Promise<{ rok: string }>;

export async function GET(request: Request, { params }: { params: tParams }) {
    const { rok } = await params;

    try {
        const year = parseInt(rok);

        if (isNaN(year)) {
            return NextResponse.json(
                { message: "Invalid year parameter." },
                { status: 400 }
            );
        }

        // Fetch VisitData for the specified year via the Season model
        const season = await db.season.findUnique({
            where: { year },
            include: {
                visitData: {
                    orderBy: { visitDate: 'asc' },
                },
            },
        });

        if (!season) {
            return NextResponse.json(
                { message: `No data found for year ${year}` },
                { status: 404 }
            );
        }

        return NextResponse.json(season.visitData);
    } catch (error) {
        console.error("[GET_VISIT_DATA_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch visit data." },
            { status: 500 }
        );
    }
}