import {db} from "@/lib/db";
import {NextResponse} from "next/server";

type tParams = Promise<{ id: string }>;

export async function PUT(req: Request, { params }: { params: tParams }) {
    const { id } = await params;
    const { title, content } = await req.json();

    const news = await db.news.update({
        where: { id },
        data: { title, content },
    });

    return NextResponse.json(news);
}

export async function DELETE(req: Request, { params }: { params: tParams }) {
    const { id } = await params;

    await db.news.delete({
        where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
}