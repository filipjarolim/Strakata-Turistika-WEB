import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const role = await currentRole();
        const { id } = await params;

        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { name, label, icon, points, color, isActive, order } = body;

        const placeType = await db.placeTypeConfig.update({
            where: { id },
            data: {
                name,
                label,
                icon,
                points,
                color,
                isActive,
                order
            }
        });

        return NextResponse.json(placeType);
    } catch (error) {
        console.error("Error updating place type config:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const role = await currentRole();
        const { id } = await params;

        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Check if it's currently used in scoring config
        // This might be tricky as scoring config uses JSON for placeTypePoints
        // For now, we just delete it. In a real app we'd warn about references.

        await db.placeTypeConfig.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting place type config:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
