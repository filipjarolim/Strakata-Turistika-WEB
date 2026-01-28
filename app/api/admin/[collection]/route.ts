import { NextRequest, NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ collection: string }> }
) {
    try {


        const role = await currentRole();


        // Check if user is admin
        if (role !== UserRole.ADMIN) {

            return new NextResponse("Unauthorized", { status: 403 });
        }

        const { collection } = await params;


        // Parse query parameters for pagination
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const searchQuery = url.searchParams.get('search') || '';
        const sortBy = url.searchParams.get('sortBy') || 'id';
        const sortDesc = url.searchParams.get('sortDesc') === 'true';
        const seasonFilter = url.searchParams.get('season') || '';
        const stateFilter = url.searchParams.get('state') || '';



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
                // Build where clause with search, season and state filter
                const visitDataWhereConditions: Record<string, unknown>[] = [];

                if (searchQuery) {
                    visitDataWhereConditions.push({
                        OR: [
                            { routeTitle: { contains: searchQuery, mode: 'insensitive' as const } },
                            { routeDescription: { contains: searchQuery, mode: 'insensitive' as const } },
                            { visitedPlaces: { contains: searchQuery, mode: 'insensitive' as const } }
                        ]
                    });
                }

                if (seasonFilter) {
                    visitDataWhereConditions.push({ seasonId: seasonFilter });
                }

                if (stateFilter) {
                    visitDataWhereConditions.push({ state: stateFilter });
                }

                const visitDataWhere = visitDataWhereConditions.length > 0
                    ? { AND: visitDataWhereConditions }
                    : {};

                // Query without problematic createdAt field
                try {
                    const rawRecords = await db.visitData.findMany({
                        where: visitDataWhere,
                        skip,
                        take: limit,
                        orderBy: { id: 'desc' }, // Sort by ID descending (newer IDs are higher)
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
                            photos: true,
                            seasonId: true,
                            userId: true,
                            places: true
                        }
                    });

                    records = rawRecords;
                    totalCount = await db.visitData.count({ where: visitDataWhere });
                } catch (visitDataError) {
                    console.error("VisitData query error:", visitDataError);
                    records = [];
                    totalCount = 0;
                }
                break;
            case "FormField":
                // Exclude DateTime fields due to conversion issues
                records = await db.formField.findMany({
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        label: true,
                        type: true,
                        placeholder: true,
                        required: true,
                        options: true,
                        order: true,
                        active: true
                    },
                    orderBy: { order: 'asc' }
                });
                totalCount = await db.formField.count();
                break;
            case "PlaceTypeConfig":
                // Exclude DateTime fields due to conversion issues
                records = await db.placeTypeConfig.findMany({
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        name: true,
                        label: true,
                        icon: true,
                        color: true,
                        points: true,
                        isActive: true,
                        order: true,
                        createdBy: true,
                        updatedBy: true
                    }
                });
                totalCount = await db.placeTypeConfig.count();
                break;
            case "ScoringConfig":
                // Exclude DateTime fields due to conversion issues
                records = await db.scoringConfig.findMany({
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        pointsPerKm: true,
                        minDistanceKm: true,
                        requireAtLeastOnePlace: true,
                        placeTypePoints: true,
                        active: true
                    }
                });
                totalCount = await db.scoringConfig.count();
                break;
            case "StrataCategory":
                records = await db.strataCategory.findMany({
                    skip,
                    take: limit,
                    orderBy
                });
                totalCount = await db.strataCategory.count();
                break;
            case "ExceptionRequest":
                records = await db.exceptionRequest.findMany({
                    skip,
                    take: limit,
                    orderBy,
                    include: { user: { select: { name: true, email: true } } }
                });
                totalCount = await db.exceptionRequest.count();
                break;
            default:

                return new NextResponse(`Unknown collection: ${collection}`, { status: 400 });
        }

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;



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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ collection: string }> }
) {
    try {
        const role = await currentRole();
        if (role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { collection } = await params;
        const body = await request.json();
        const { ids } = body as { ids: string[] };

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }



        let deletedCount = 0;

        // Delete records based on collection
        switch (collection) {
            case "User":
                const userResult = await db.user.deleteMany({ where: { id: { in: ids } } });
                deletedCount = userResult.count;
                break;
            case "Account":
                const accountResult = await db.account.deleteMany({ where: { id: { in: ids } } });
                deletedCount = accountResult.count;
                break;
            case "VerificationToken":
                const verificationResult = await db.verificationToken.deleteMany({ where: { id: { in: ids } } });
                deletedCount = verificationResult.count;
                break;
            case "PasswordResetToken":
                const passwordResetResult = await db.passwordResetToken.deleteMany({ where: { id: { in: ids } } });
                deletedCount = passwordResetResult.count;
                break;
            case "TwoFactorToken":
                const twoFactorTokenResult = await db.twoFactorToken.deleteMany({ where: { id: { in: ids } } });
                deletedCount = twoFactorTokenResult.count;
                break;
            case "TwoFactorConfirmation":
                const twoFactorConfirmationResult = await db.twoFactorConfirmation.deleteMany({ where: { id: { in: ids } } });
                deletedCount = twoFactorConfirmationResult.count;
                break;
            case "News":
                const newsResult = await db.news.deleteMany({ where: { id: { in: ids } } });
                deletedCount = newsResult.count;
                break;
            case "Season":
                const seasonResult = await db.season.deleteMany({ where: { id: { in: ids } } });
                deletedCount = seasonResult.count;
                break;
            case "VisitData":
                const visitDataResult = await db.visitData.deleteMany({ where: { id: { in: ids } } });
                deletedCount = visitDataResult.count;
                break;
            case "FormField":
                const formFieldResult = await db.formField.deleteMany({ where: { id: { in: ids } } });
                deletedCount = formFieldResult.count;
                break;
            case "PlaceTypeConfig":
                const placeTypeConfigResult = await db.placeTypeConfig.deleteMany({ where: { id: { in: ids } } });
                deletedCount = placeTypeConfigResult.count;
                break;
            case "ScoringConfig":
                const scoringConfigResult = await db.scoringConfig.deleteMany({ where: { id: { in: ids } } });
                deletedCount = scoringConfigResult.count;
                break;
            case "StrataCategory":
                const strataCategoryResult = await db.strataCategory.deleteMany({ where: { id: { in: ids } } });
                deletedCount = strataCategoryResult.count;
                break;
            case "ExceptionRequest":
                const exceptionRequestResult = await db.exceptionRequest.deleteMany({ where: { id: { in: ids } } });
                deletedCount = exceptionRequestResult.count;
                break;
            default:
                return NextResponse.json({ error: `Unknown collection: ${collection}` }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully deleted ${deletedCount} record(s)`,
            deletedCount
        });
    } catch (error: unknown) {
        console.error("Error bulk deleting records:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
} 