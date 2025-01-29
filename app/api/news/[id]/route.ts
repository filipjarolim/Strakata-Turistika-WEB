import {db} from "@/lib/db";
import {NextResponse} from "next/server";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const { title, content } = await req.json();

    const news = await db.news.update({
        where: { id: params.id },
        data: { title, content },
    });

    return NextResponse.json(news);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    await db.news.delete({
        where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
}