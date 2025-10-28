import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function PUT(request: Request) {
    try {
        const role = await currentRole();
        
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { placeTypeIds } = body;

        if (!Array.isArray(placeTypeIds)) {
            return NextResponse.json(
                { error: "placeTypeIds must be an array" },
                { status: 400 }
            );
        }

        // Update order for each place type
        for (let i = 0; i < placeTypeIds.length; i++) {
            await db.placeTypeConfig.update({
                where: { id: placeTypeIds[i] },
                data: {
                    order: i,
                    updatedAt: new Date(),
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering place type configs:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
