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
        const { fieldNames } = body;

        if (!Array.isArray(fieldNames)) {
            return NextResponse.json(
                { error: "fieldNames must be an array" },
                { status: 400 }
            );
        }

        // Update order for each field
        for (let i = 0; i < fieldNames.length; i++) {
            await db.formField.update({
                where: { name: fieldNames[i] },
                data: {
                    order: i,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering form fields:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

