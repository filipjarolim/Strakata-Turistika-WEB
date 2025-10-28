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
        
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { name, label, icon, points, color } = body;

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

        // Update place type
        const placeType = await db.placeTypeConfig.update({
            where: { id },
            data: {
                name: name ?? existing.name,
                label: label ?? existing.label,
                icon: icon ?? existing.icon,
                points: points !== undefined ? points : existing.points,
                color: color ?? existing.color,
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({ success: true, placeType });
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
        
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { id } = await params;

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

        // Delete place type
        await db.placeTypeConfig.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting place type config:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
