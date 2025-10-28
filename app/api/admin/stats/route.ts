import { NextResponse } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole, VisitState } from "@prisma/client";
import { db } from "@/lib/db";
import { MongoClient } from "mongodb";

export async function GET() {
    try {
        const role = await currentRole();
        
        if (role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Get total count
        const total = await db.visitData.count();

        // Get counts by state
        const pendingCount = await db.visitData.count({
            where: { state: VisitState.PENDING_REVIEW }
        });

        const approvedCount = await db.visitData.count({
            where: { state: VisitState.APPROVED }
        });

        const rejectedCount = await db.visitData.count({
            where: { state: VisitState.REJECTED }
        });

        // Get database collection counts
        const databaseStats = {
            user: await db.user.count(),
            visitData: total,
            news: await db.news.count(),
            season: await db.season.count(),
            account: await db.account.count(),
            verificationToken: await db.verificationToken.count(),
            passwordResetToken: await db.passwordResetToken.count(),
            twoFactorToken: await db.twoFactorToken.count(),
            twoFactorConfirmation: await db.twoFactorConfirmation.count(),
            formField: await db.formField.count(),
            placeTypeConfig: await db.placeTypeConfig.count(),
            scoringConfig: await db.scoringConfig.count(),
        };

        // Calculate total records
        const totalRecords = Object.values(databaseStats).reduce((sum, count) => sum + count, 0);

        // Get database size statistics
        let databaseSize: Record<string, unknown> | null = null;
        try {
            const client = new MongoClient(process.env.DATABASE_URL!);
            await client.connect();
            const mongodb = client.db();
            
            // First, get list of actual collections in the database
            const collectionsList = await mongodb.listCollections().toArray();
            const existingCollections = new Set(collectionsList.map(c => c.name));
            
            // Map camelCase keys to PascalCase collection names
            const collectionNameMap: Record<string, string> = {
                user: 'User',
                visitData: 'VisitData',
                news: 'News',
                season: 'Season',
                account: 'Account',
                verificationToken: 'VerificationToken',
                passwordResetToken: 'PasswordResetToken',
                twoFactorToken: 'TwoFactorToken',
                twoFactorConfirmation: 'TwoFactorConfirmation',
                formField: 'FormField',
                placeTypeConfig: 'PlaceTypeConfig',
                scoringConfig: 'ScoringConfig'
            };
            
            const collections = Object.keys(databaseStats);
            const sizeStats: Record<string, { sizeMB: number; count: number }> = {};
            let totalSizeMB = 0;

            for (const collectionKey of collections) {
                try {
                    const collectionName = collectionNameMap[collectionKey] || collectionKey;
                    
                    // Only try to get stats if collection exists
                    if (!existingCollections.has(collectionName)) {
                        sizeStats[collectionKey] = {
                            sizeMB: 0,
                            count: databaseStats[collectionKey as keyof typeof databaseStats]
                        };
                        continue;
                    }
                    
                    // Use db.command to get collection statistics
                    const stats = await mongodb.command({ collStats: collectionName });
                    // stats is returned directly from collStats command
                    const sizeBytes = stats.size || 0;
                    const sizeMB = sizeBytes / (1024 * 1024); // Convert bytes to MB
                    totalSizeMB += sizeMB;
                    sizeStats[collectionKey] = {
                        sizeMB: parseFloat(sizeMB.toFixed(2)),
                        count: databaseStats[collectionKey as keyof typeof databaseStats]
                    };
                } catch (e) {
                    console.error(`Failed to get stats for ${collectionKey}:`, e);
                    sizeStats[collectionKey] = {
                        sizeMB: 0,
                        count: databaseStats[collectionKey as keyof typeof databaseStats]
                    };
                }
            }

            // Get database total stats
            const dbStats = await mongodb.command({ dbStats: 1 });
            const dbSizeMB = (dbStats.dataSize || 0) / (1024 * 1024);
            const storageSizeMB = (dbStats.storageSize || 0) / (1024 * 1024);
            const indexSizeMB = (dbStats.indexSize || 0) / (1024 * 1024);
            
            // Try to get cluster/server information for limits
            let freeSpaceMB: number | null = null;
            let totalSpaceMB: number | null = null;
            let maxSizeMB: number | null = null;
            let percentageUsed: number | null = null;
            
            try {
                // Try to get server status for more details
                const serverStatus = await mongodb.command({ serverStatus: 1 });
                
                // Try to get filesystem info (may not be available on Atlas)
                if (dbStats.fsUsedSize && dbStats.fsTotalSize) {
                    const used = (dbStats.fsUsedSize || 0) / (1024 * 1024);
                    const total = (dbStats.fsTotalSize || 0) / (1024 * 1024);
                    freeSpaceMB = parseFloat((total - used).toFixed(2));
                    totalSpaceMB = parseFloat(total.toFixed(2));
                    maxSizeMB = total;
                    percentageUsed = parseFloat(((used / total) * 100).toFixed(1));
                }
                
                // For MongoDB Atlas, try to get storage limits from server status or metrics
                // Atlas typically provides this info in different ways
                // Note: Most Atlas limits are managed externally, but we can show what we have
            } catch (e) {
                console.error('Error getting server status:', e);
            }

            // Sort by size descending to find what takes most space
            const sortedBySize = Object.entries(sizeStats)
                .sort((a, b) => b[1].sizeMB - a[1].sizeMB);

            databaseSize = {
                totalSizeMB: parseFloat(dbSizeMB.toFixed(2)),
                storageSizeMB: parseFloat(storageSizeMB.toFixed(2)),
                indexSizeMB: parseFloat(indexSizeMB.toFixed(2)),
                collectionsSize: totalSizeMB,
                freeSpaceMB,
                totalSpaceMB,
                maxSizeMB,
                percentageUsed,
                collections: sizeStats,
                topCollections: sortedBySize.slice(0, 5).map(([name, data]) => ({
                    name,
                    ...data
                }))
            };

            await client.close();
        } catch (error) {
            console.error('Error fetching database size:', error);
            // Continue without size info if error occurs
        }

        return NextResponse.json({
            total,
            pending: pendingCount,
            approved: approvedCount,
            rejected: rejectedCount,
            database: {
                stats: databaseStats,
                totalRecords,
                size: databaseSize
            }
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}








