import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const role = await currentRole();

        // Admin sees all fields (including inactive), users only see active fields
        const where = role === UserRole.ADMIN
            ? {}
            : { active: true };

        const fields = await db.formField.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(fields);
    } catch (error) {
        console.error("Error fetching form fields:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const role = await currentRole();

        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { name, label, type, required, placeholder, options } = body;

        // Validate required fields
        if (!name || !label || !type) {
            return NextResponse.json(
                { error: "Name, label and type are required" },
                { status: 400 }
            );
        }

        // Check if name already exists
        const existing = await db.formField.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Field with this name already exists" },
                { status: 409 }
            );
        }

        // Get current max order
        const maxOrderField = await db.formField.findFirst({
            orderBy: { order: 'desc' }
        });
        const nextOrder = maxOrderField ? maxOrderField.order + 1 : 0;

        // Create new field
        const field = await db.formField.create({
            data: {
                name,
                label,
                type,
                required: required ?? false,
                placeholder: placeholder ?? null,
                options: options ?? null,
                order: nextOrder,
                active: true,
            }
        });

        return NextResponse.json({ success: true, field });
    } catch (error) {
        console.error("Error creating form field:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
