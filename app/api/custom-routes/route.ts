import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user || !user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, link, parts, route } = body;

        if (!title || !route) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create the custom route
        const customRoute = await db.customRoute.create({
            data: {
                title,
                description,
                link: link || "",
                parts: parts || {},
                creator: {
                    connect: { id: user.id }
                }
                // Status defaults to PENDING_REVIEW
            }
        });

        return NextResponse.json(customRoute);
    } catch (error) {
        console.error("Error creating custom route:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
