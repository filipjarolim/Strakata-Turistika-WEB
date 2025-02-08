import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        // Fetch all years from the Season model
        const seasons = await db.season.findMany({
            select: { year: true },
            orderBy: { year: "asc" },
        });

        // Return just the array of years
        const years = seasons.map((season) => season.year);
        return NextResponse.json(years);
    } catch (error) {
        console.error("[GET_SEASONS_ERROR]", error);

        // Handle the error properly with a 500 status
        return NextResponse.json(
            { message: "Failed to fetch seasons." },
            { status: 500 }
        );
    }
}