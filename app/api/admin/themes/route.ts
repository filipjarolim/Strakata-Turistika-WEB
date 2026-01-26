import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const themes = await db.monthlyTheme.findMany({
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        return NextResponse.json(themes);
    } catch (error) {
        console.error("[THEMES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await req.json();
        const { year, month, keywords } = body;

        if (!year || !month || !keywords || keywords.length !== 3) {
            return new NextResponse("Invalid data", { status: 400 });
        }

        const theme = await db.monthlyTheme.upsert({
            where: {
                year_month: {
                    year,
                    month
                }
            },
            update: {
                keywords
            },
            create: {
                year,
                month,
                keywords
            }
        });

        return NextResponse.json(theme);
    } catch (error) {
        console.error("[THEMES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return new NextResponse("Missing ID", { status: 400 });
        }

        await db.monthlyTheme.delete({
            where: { id }
        });

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("[THEMES_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
