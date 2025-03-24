import { NextRequest, NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ collection: string }> }
) {
    try {
        const role = await currentRole();

        // Check if user is admin
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { collection } = await params;
        let records;

        // Get records based on collection name
        switch (collection) {
            case "User":
                records = await db.user.findMany();
                break;
            case "Account":
                records = await db.account.findMany();
                break;
            case "VerificationToken":
                records = await db.verificationToken.findMany();
                break;
            case "PasswordResetToken":
                records = await db.passwordResetToken.findMany();
                break;
            case "TwoFactorToken":
                records = await db.twoFactorToken.findMany();
                break;
            case "TwoFactorConfirmation":
                records = await db.twoFactorConfirmation.findMany();
                break;
            case "News":
                records = await db.news.findMany();
                break;
            case "Season":
                records = await db.season.findMany();
                break;
            case "VisitData":
                records = await db.visitData.findMany();
                break;
            default:
                return new NextResponse(`Unknown collection: ${collection}`, { status: 400 });
        }

        return NextResponse.json(records);
    } catch (error) {
        console.error("Error fetching records:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
} 