import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const role = await currentRole();
        
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { isActive } = body;

        if (typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: "isActive must be a boolean" },
                { status: 400 }
            );
        }

        // Check if place type exists
        const existing = await db.placeTypeConfig.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Place type not found" },
                { status: 404 }
            );
        }

        // Update status
        await db.placeTypeConfig.update({
            where: { id },
            data: {
                isActive,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating place type status:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

