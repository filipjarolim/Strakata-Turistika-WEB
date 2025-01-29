import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    const news = await db.news.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(news);
}

export async function POST(req: Request) {
    const { title, content } = await req.json();
    console.log("POSTING")

    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const news = await db.news.create({
        data: { title, content },
    });

    return NextResponse.json(news);
}

