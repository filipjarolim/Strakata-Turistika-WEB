import { NextResponse } from "next/server";
import {db} from "@/lib/db";

// Start Tracking
export async function POST(req: Request) {
    try {
        const { userId, locations, distance, duration } = await req.json();

        // Ensure user ID exists
        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        // Save tracking session to DB
        const session = await db.trackingSession.create({
            data: {
                userId,
                startTime: new Date(),
                endTime: new Date(),
                duration,
                distance,
                path: locations,
            },
        });

        return NextResponse.json({ success: true, session }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save tracking session" }, { status: 500 });
    }
}

// Get user tracking history
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        const sessions = await db.trackingSession.findMany({
            where: { userId },
            orderBy: { startTime: "desc" },
        });

        return NextResponse.json({ success: true, sessions }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch tracking data" }, { status: 500 });
    }
}
