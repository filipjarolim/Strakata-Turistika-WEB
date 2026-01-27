import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET() {
    try {


        // Test authentication
        const role = await currentRole();


        if (role !== UserRole.ADMIN) {
            return NextResponse.json({
                error: "Unauthorized",
                role: role,
                message: "User is not an admin"
            }, { status: 403 });
        }

        // Test database connection
        try {
            const userCount = await db.user.count();


            return NextResponse.json({
                success: true,
                message: "Database connection successful",
                userCount: userCount,
                role: role
            });
        } catch (dbError) {
            console.error("Test API: Database error:", dbError);
            return NextResponse.json({
                error: "Database connection failed",
                details: dbError instanceof Error ? dbError.message : 'Unknown database error',
                role: role
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Test API: General error:", error);
        return NextResponse.json({
            error: "Test failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

