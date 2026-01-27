import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ collection: string }> } // Expecting Promise for params in Next.js 15
) {
    const role = await currentRole();
    if (role !== "ADMIN") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { collection } = await params;

    try {
        // Dynamic access to prisma delegate
        // @ts-ignore
        const delegate = db[collection.charAt(0).toLowerCase() + collection.slice(1)];

        if (!delegate) {
            return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }

        const data = await delegate.findMany({
            take: 100,
            orderBy: { id: 'desc' } // Assuming most models have ID. If not, this might fail, but Prisma usually adds ID.
        });

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Raw DB access error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
