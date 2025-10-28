import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const role = await currentRole();
        
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // CRITICAL: Get only the first (and should be only) scoring config
        // Exclude updatedAt to avoid DateTime conversion error
        let config = await db.scoringConfig.findFirst({
            select: {
                id: true,
                pointsPerKm: true,
                minDistanceKm: true,
                requireAtLeastOnePlace: true,
                placeTypePoints: true,
                active: true,
            },
            where: { active: true } // Only get active configs
        });
        
        // If no config exists, create default one
        if (!config) {
            // First, delete any inactive or duplicate configs
            await db.scoringConfig.deleteMany({});
            
            config = await db.scoringConfig.create({
                data: {
                    pointsPerKm: 2.0,
                    minDistanceKm: 3.0,
                    requireAtLeastOnePlace: true,
                    placeTypePoints: {
                        PEAK: 1.0,
                        TOWER: 1.0,
                        TREE: 1.0,
                        OTHER: 0.0,
                    },
                    active: true,
                },
                select: {
                    id: true,
                    pointsPerKm: true,
                    minDistanceKm: true,
                    requireAtLeastOnePlace: true,
                    placeTypePoints: true,
                    active: true,
                }
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching scoring config:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const role = await currentRole();
        
        if (role !== UserRole.ADMIN) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const body = await request.json();
        const { pointsPerKm, minDistanceKm, requireAtLeastOnePlace, placeTypePoints } = body;

        // Validate inputs
        if (typeof pointsPerKm !== 'number' || pointsPerKm < 0) {
            return NextResponse.json(
                { error: "Invalid pointsPerKm value" },
                { status: 400 }
            );
        }

        if (typeof minDistanceKm !== 'number' || minDistanceKm < 0) {
            return NextResponse.json(
                { error: "Invalid minDistanceKm value" },
                { status: 400 }
            );
        }

        // CRITICAL: Find the first active config (should only be one)
        const existingConfig = await db.scoringConfig.findFirst({
            where: { active: true },
            orderBy: { id: 'asc' } // Get the oldest one if multiple exist
        });
        
        let config;
        if (existingConfig) {
            // Update existing active config
            config = await db.scoringConfig.update({
                where: { id: existingConfig.id },
                data: {
                    pointsPerKm,
                    minDistanceKm,
                    requireAtLeastOnePlace: requireAtLeastOnePlace ?? true,
                    placeTypePoints: placeTypePoints || existingConfig.placeTypePoints,
                }
            });
            
            // Deactivate any other configs (shouldn't exist, but just in case)
            await db.scoringConfig.updateMany({
                where: {
                    active: true,
                    id: { not: existingConfig.id }
                },
                data: { active: false }
            });
        } else {
            // No config exists, create new one and delete any inactive ones
            await db.scoringConfig.deleteMany({});
            
            config = await db.scoringConfig.create({
                data: {
                    pointsPerKm,
                    minDistanceKm,
                    requireAtLeastOnePlace: requireAtLeastOnePlace ?? true,
                    placeTypePoints: placeTypePoints || {
                        PEAK: 1.0,
                        TOWER: 1.0,
                        TREE: 1.0,
                        OTHER: 0.0,
                    },
                    active: true,
                }
            });
        }

        return NextResponse.json({ success: true, config });
    } catch (error) {
        console.error("Error updating scoring config:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
