import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole, VisitState } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const role = await currentRole();
        
        if (role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get total count
        const total = await db.visitData.count();

        // Get counts by state
        const pendingCount = await db.visitData.count({
            where: { state: VisitState.PENDING_REVIEW }
        });

        const approvedCount = await db.visitData.count({
            where: { state: VisitState.APPROVED }
        });

        const rejectedCount = await db.visitData.count({
            where: { state: VisitState.REJECTED }
        });

        return NextResponse.json({
            total,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}



