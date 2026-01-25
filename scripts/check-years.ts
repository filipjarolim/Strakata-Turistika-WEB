
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // Group by year (seasonYear)
    // Prisma mongo aggregation for group by might need workaround or raw
    // Or just simple count queries for recent years

    // We can use groupBy if using recent prisma version
    const groups = await prisma.visitData.groupBy({
        by: ['year'],
        _count: {
            id: true
        },
        orderBy: {
            year: 'desc'
        }
    });

    console.log("Visits per year:");
    console.table(groups);

    // Check users count for top year
    if (groups.length > 0) {
        const topYear = groups[0].year;
        const distinctUsers = await prisma.visitData.findMany({
            where: { year: topYear },
            select: { userId: true },
            distinct: ['userId']
        });
        console.log(`Distinct users in ${topYear}: ${distinctUsers.length}`);
    }
}
main().finally(() => prisma.$disconnect());
