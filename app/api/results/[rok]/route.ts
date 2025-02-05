import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type tParams = Promise<{ rok: string }>;

export async function GET(request: Request, { params }: { params: tParams }) {
    const { rok } = await params; // Extract 'rok' from the dynamic route parameters

    try {
        const year = parseInt(rok);

        if (isNaN(year)) {
            return NextResponse.json(
                { message: "Invalid year parameter." },
                { status: 400 } // Bad Request
            );
        }

        // Fetch all VisitData for the specified year
        const visitData = await db.visitData.findMany({
            where: { year },
            orderBy: { visitDate: "asc" },
        });

        return NextResponse.json(visitData);
    } catch (error) {
        console.error("[GET_VISIT_DATA_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch visit data." },
            { status: 500 } // Internal Server Error
        );
    }
}