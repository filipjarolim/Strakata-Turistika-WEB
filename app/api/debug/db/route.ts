import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL;
        const maskedUrl = dbUrl
            ? `${dbUrl.substring(0, 15)}...${dbUrl.substring(dbUrl.length - 5)}`
            : "NOT_DEFINED";

        const startTime = Date.now();
        // Try a simple query
        const userCount = await db.user.count();
        const duration = Date.now() - startTime;

        return NextResponse.json({
            status: "ok",
            message: "Database connection successful",
            maskedUrl,
            userCount,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("[DB_DEBUG] Connection failed:", error);
        return NextResponse.json({
            status: "error",
            message: "Database connection failed",
            error: error instanceof Error ? error.message : String(error),
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV
            }
        }, { status: 500 });
    }
}
