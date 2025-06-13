import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET() {
    try {
        const news = await db.news.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true
            }
        });
        
        return new NextResponse(JSON.stringify(news), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59'
            },
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error" }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function POST(req: Request) {
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

        const news = await db.news.create({
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
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error("Error creating news:", error);
        return new NextResponse(
            JSON.stringify({ error: "Internal Server Error" }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

