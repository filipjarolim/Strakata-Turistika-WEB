import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Save Background Tracking Data
export async function POST(req: Request) {
    try {
        const { userId, location } = await req.json();

        if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

        const trackingSession = await db.trackingSession.findFirst({
            where: { userId, endTime: null },
        });

        if (!trackingSession) {
            return NextResponse.json({ error: "No active tracking session" }, { status: 400 });
        }

        const path = Array.isArray(trackingSession.path) ? trackingSession.path : [];

        await db.trackingSession.update({
            where: { id: trackingSession.id },
            data: {
                path: [...path, location],
            },
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update tracking" }, { status: 500 });
    }
}