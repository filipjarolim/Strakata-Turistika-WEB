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

        const { id: name } = await params;
        const body = await request.json();
        const { label, type, required, placeholder, options } = body;

        // Check if field exists
        const existing = await db.formField.findUnique({
            where: { name }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Field not found" },
                { status: 404 }
            );
        }

        // Update field
        const field = await db.formField.update({
            where: { name },
            data: {
                label: label ?? existing.label,
                type: type ?? existing.type,
                required: required !== undefined ? required : existing.required,
                placeholder: placeholder !== undefined ? placeholder : existing.placeholder,
                options: options !== undefined ? options : existing.options,
            }
        });

        return NextResponse.json({ success: true, field });
    } catch (error) {
        console.error("Error updating form field:", error);
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

        const { id: name } = await params;

        // Check if field exists
        const existing = await db.formField.findUnique({
            where: { name }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Field not found" },
                { status: 404 }
            );
        }

        // Delete field
        await db.formField.delete({
            where: { name }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting form field:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

