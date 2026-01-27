import { NextResponse } from "next/server";
import { getRecordById } from "@/actions/admin/getRecordById";
import { updateRecord } from "@/actions/admin/updateRecord";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ collection: string; id: string }> }
) {
    const { collection, id } = await params;
    try {
        const record = await getRecordById(collection, id);
        if (!record) {
            return NextResponse.json({ error: "Record not found" }, { status: 404 });
        }
        return NextResponse.json(record);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ collection: string; id: string }> }
) {
    const { collection, id } = await params;
    const data = await request.json();


    const result = await updateRecord(collection, id, data);

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, record: result.updatedRecord });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ collection: string; id: string }> }
) {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { collection, id } = await params;


        // Delete record based on collection
        switch (collection) {
            case "User":
                await db.user.delete({ where: { id } });
                break;
            case "Account":
                await db.account.delete({ where: { id } });
                break;
            case "VerificationToken":
                await db.verificationToken.delete({ where: { id } });
                break;
            case "PasswordResetToken":
                await db.passwordResetToken.delete({ where: { id } });
                break;
            case "TwoFactorToken":
                await db.twoFactorToken.delete({ where: { id } });
                break;
            case "TwoFactorConfirmation":
                await db.twoFactorConfirmation.delete({ where: { id } });
                break;
            case "News":
                await db.news.delete({ where: { id } });
                break;
            case "Season":
                await db.season.delete({ where: { id } });
                break;
            case "VisitData":
                await db.visitData.delete({ where: { id } });
                break;
            default:
                return NextResponse.json({ error: `Unknown collection: ${collection}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Record deleted successfully" });
    } catch (error: unknown) {
        console.error("Error deleting record:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}
