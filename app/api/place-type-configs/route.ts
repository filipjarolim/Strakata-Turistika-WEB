import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

// Default place types to create on initialization
const DEFAULT_PLACE_TYPES = [
    {
        id: "PEAK",
        name: "PEAK",
        label: "Vrchol",
        icon: "terrain",
        points: 1,
        color: "#FF9800",
        order: 0
    },
    {
        id: "TOWER",
        name: "TOWER",
        label: "Rozhledna",
        icon: "attractions",
        points: 1,
        color: "#2196F3",
        order: 1
    },
    {
        id: "TREE",
        name: "TREE",
        label: "Památný strom",
        icon: "park",
        points: 1,
        color: "#4CAF50",
        order: 2
    },
    {
        id: "OTHER",
        name: "OTHER",
        label: "Jiné",
        icon: "place",
        points: 0,
        color: "#9E9E9E",
        order: 3
    },
    {
        id: "RUINS",
        name: "RUINS",
        label: "Zřícenina",
        icon: "castle",
        points: 1,
        color: "#F59E0B",
        order: 4
    },
    {
        id: "CAVE",
        name: "CAVE",
        label: "Jeskyně",
        icon: "terrain",
        points: 1,
        color: "#6B7280",
        order: 5
    },
    {
        id: "UNUSUAL_NAME",
        name: "UNUSUAL_NAME",
        label: "Neobvyklý název",
        icon: "star",
        points: 1,
        color: "#9333EA",
        order: 6
    }
];

export async function GET() {
    try {
        const role = await currentRole();

        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        let placeTypes = await db.placeTypeConfig.findMany({
            orderBy: { order: 'asc' }
        });

        // If no place types exist, create defaults
        if (placeTypes.length === 0) {
            placeTypes = await Promise.all(
                DEFAULT_PLACE_TYPES.map(pt =>
                    db.placeTypeConfig.create({ data: { ...pt, isActive: true } })
                )
            );
        }

        return NextResponse.json(placeTypes);
    } catch (error) {
        console.error("Error fetching place type configs:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const role = await currentRole();

        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { id, name, label, icon, points, color } = body;

        // Validate required fields
        if (!id || !name || !label) {
            return NextResponse.json(
                { error: "ID, name and label are required" },
                { status: 400 }
            );
        }

        // Check if ID already exists
        const existing = await db.placeTypeConfig.findUnique({
            where: { id }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Place type with this ID already exists" },
                { status: 409 }
            );
        }

        // Get current max order
        const maxOrderType = await db.placeTypeConfig.findFirst({
            orderBy: { order: 'desc' }
        });
        const nextOrder = maxOrderType ? maxOrderType.order + 1 : 0;

        // Create new place type
        const placeType = await db.placeTypeConfig.create({
            data: {
                id,
                name,
                label,
                icon: icon ?? 'place',
                points: points ?? 1,
                color: color ?? '#9E9E9E',
                order: nextOrder,
                isActive: true,
            }
        });

        return NextResponse.json({ success: true, placeType });
    } catch (error) {
        console.error("Error creating place type config:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
