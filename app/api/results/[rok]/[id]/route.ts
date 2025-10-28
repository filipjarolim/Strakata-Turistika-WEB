import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type tParams = Promise<{ rok: string; id: string }>;

export async function GET(request: Request, { params }: { params: tParams }) {
    const { rok, id } = await params;

    try {
        const year = parseInt(rok);

        if (isNaN(year)) {
            return NextResponse.json(
                { message: "Invalid year parameter." },
                { status: 400 }
            );
        }

        const visitData = await db.visitData.findFirst({
            where: {
                id: id,
                year: year
            },
            select: {
                id: true,
                visitDate: true,
                routeTitle: true,
                routeDescription: true,
                dogName: true,
                points: true,
                visitedPlaces: true,
                dogNotAllowed: true,
                routeLink: true,
                route: true,
                year: true,
                extraPoints: true,
                state: true,
                rejectionReason: true,
                // Note: createdAt excluded to avoid Prisma conversion errors
                photos: true,
                places: true,
                user: {
                    select: {
                        name: true,
                        dogName: true
                    }
                }
            }
        });

        if (!visitData) {
            return NextResponse.json(
                { message: "Visit data not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(visitData);
    } catch (error) {
        console.error("[GET_VISIT_DATA_ERROR]", error);
        return NextResponse.json(
            { message: "Failed to fetch visit data." },
            { status: 500 }
        );
    }
} 