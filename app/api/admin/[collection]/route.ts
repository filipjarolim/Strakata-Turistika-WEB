import { NextRequest, NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ collection: string }> }
) {
    try {
        console.log("Admin API: Starting request");
        
        const role = await currentRole();
        console.log("Admin API: User role:", role);

        // Check if user is admin
        if (role !== UserRole.ADMIN) {
            console.log("Admin API: Unauthorized access - role is not ADMIN");
            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { collection } = await params;
        console.log("Admin API: Fetching collection:", collection);
        
        // Parse query parameters for pagination
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const searchQuery = url.searchParams.get('search') || '';
        const sortBy = url.searchParams.get('sortBy') || 'id';
        const sortDesc = url.searchParams.get('sortDesc') === 'true';
        
        console.log("Admin API: Pagination params:", { page, limit, searchQuery, sortBy, sortDesc });
        
        let records: unknown[] = [];
        let totalCount = 0;

        // Get records based on collection name with pagination
        const skip = (page - 1) * limit;
        const orderBy = { [sortBy]: sortDesc ? 'desc' : 'asc' };
        
        switch (collection) {
            case "User":
                const userWhere = searchQuery ? {
                    OR: [
                        { name: { contains: searchQuery, mode: 'insensitive' as const } },
                        { email: { contains: searchQuery, mode: 'insensitive' as const } }
                    ]
                } : {};
                records = await db.user.findMany({
                    where: userWhere,
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.user.count({ where: userWhere });
                break;
            case "Account":
                records = await db.account.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.account.count();
                break;
            case "VerificationToken":
                records = await db.verificationToken.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.verificationToken.count();
                break;
            case "PasswordResetToken":
                records = await db.passwordResetToken.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.passwordResetToken.count();
                break;
            case "TwoFactorToken":
                records = await db.twoFactorToken.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.twoFactorToken.count();
                break;
            case "TwoFactorConfirmation":
                records = await db.twoFactorConfirmation.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.twoFactorConfirmation.count();
                break;
            case "News":
                const newsWhere = searchQuery ? {
                    OR: [
                        { title: { contains: searchQuery, mode: 'insensitive' as const } },
                        { content: { contains: searchQuery, mode: 'insensitive' as const } }
                    ]
                } : {};
                records = await db.news.findMany({
                    where: newsWhere,
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.news.count({ where: newsWhere });
                break;
            case "Season":
                records = await db.season.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.season.count();
                break;
            case "VisitData":
                try {
                    // Use findMany with select to avoid type conversion issues
                    const visitDataWhere = searchQuery ? {
                        OR: [
                            { routeTitle: { contains: searchQuery, mode: 'insensitive' as const } },
                            { routeDescription: { contains: searchQuery, mode: 'insensitive' as const } },
                            { visitedPlaces: { contains: searchQuery, mode: 'insensitive' as const } }
                        ]
                    } : {};
                    
                    const rawRecords = await db.visitData.findMany({
                        where: visitDataWhere,
                        skip,
                        take: limit,
                        orderBy,
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
                            createdAt: true,
                            photos: true,
                            seasonId: true,
                            userId: true
                        }
                    });
                    
                    // Process the records to handle visitDate properly
                    records = rawRecords.map(record => ({
                        ...record,
                        visitDate: record.visitDate ? 
                            (typeof record.visitDate === 'string' ? record.visitDate : 
                             record.visitDate instanceof Date ? record.visitDate.toISOString() :
                             JSON.stringify(record.visitDate)) : null,
                        createdAt: record.createdAt ? 
                            (record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt) : null
                    }));
                    
                    totalCount = await db.visitData.count({ where: visitDataWhere });
                } catch (visitDataError) {
                    console.error("VisitData query error:", visitDataError);
                    // Fallback: try to get records without select
                    try {
                        console.log("Trying fallback query for VisitData...");
                        const fallbackRecords = await db.visitData.findMany({
                            where: searchQuery ? {
                                OR: [
                                    { routeTitle: { contains: searchQuery, mode: 'insensitive' as const } },
                                    { routeDescription: { contains: searchQuery, mode: 'insensitive' as const } },
                                    { visitedPlaces: { contains: searchQuery, mode: 'insensitive' as const } }
                                ]
                            } : {},
                            skip,
                            take: limit,
                            orderBy
                        });
                        
                        records = fallbackRecords.map(record => ({
                            ...record,
                            visitDate: record.visitDate ? String(record.visitDate) : null,
                            createdAt: record.createdAt ? 
                                (record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt)) : null
                        }));
                        
                        totalCount = await db.visitData.count({ 
                            where: searchQuery ? {
                                OR: [
                                    { routeTitle: { contains: searchQuery, mode: 'insensitive' as const } },
                                    { routeDescription: { contains: searchQuery, mode: 'insensitive' as const } },
                                    { visitedPlaces: { contains: searchQuery, mode: 'insensitive' as const } }
                                ]
                            } : {}
                        });
                    } catch (fallbackError) {
                        console.error("VisitData fallback query also failed:", fallbackError);
                        records = [];
                        totalCount = 0;
                    }
                }
                break;
            default:
                console.log("Admin API: Unknown collection:", collection);
                return new NextResponse(`Unknown collection: ${collection}`, { status: 400 });
        }

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        console.log(`Admin API: Successfully fetched ${records.length} records for ${collection} (page ${page}/${totalPages})`);
        
        return NextResponse.json({
            data: records,
            total: totalCount,
            page,
            limit,
            hasMore,
            totalPages
        });
    } catch (error) {
        console.error("Admin API: Error fetching records:", error);
        return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
    }
} 