import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const id = await params.id;
    if (!id) {
        return new NextResponse(
            JSON.stringify({ error: "Missing ID" }),
            { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        const news = await db.news.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true
            }
        });

        if (!news) {
            return new NextResponse(
                JSON.stringify({ error: "Not found" }),
                { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new NextResponse(
            JSON.stringify(news),
            { 
                status: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59'
                }
            }
        );
    } catch (error) {
        console.error("Error fetching news item:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error" }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const role = await currentRole();

        if (role !== UserRole.ADMIN) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized" }),
                { 
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const id = await params.id;
        if (!id) {
            return new NextResponse(
                JSON.stringify({ error: "Missing ID" }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const { title, content } = await req.json();

        if (!title) {
            return new NextResponse(
                JSON.stringify({ error: "Title is required" }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const news = await db.news.update({
            where: { id },
            data: { title, content },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true
            }
        });

        return new NextResponse(
            JSON.stringify(news),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error("Error updating news:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error" }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const role = await currentRole();

        if (role !== UserRole.ADMIN) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized" }),
                { 
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const id = await params.id;
        if (!id) {
            return new NextResponse(
                JSON.stringify({ error: "Missing ID" }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        await db.news.delete({
            where: { id }
        });

        return new NextResponse(null, { 
            status: 204,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error deleting news:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error" }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}