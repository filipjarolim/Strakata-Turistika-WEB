
import { getPaginatedVisitData } from '@/lib/results-utils';
import { db } from '@/lib/db';

async function main() {
    console.log("Debugging API Logic for Season 2026...");

    // 1. Prisma Count directly
    const prismaCount = await db.visitData.count({
        where: { year: 2026, state: 'APPROVED' }
    });
    console.log(`Prisma Count (2026, APPROVED): ${prismaCount}`);

    // 2. Run getPaginatedVisitData via library
    try {
        const result = await getPaginatedVisitData({
            page: 1,
            limit: 10,
            season: 2026,
            state: 'APPROVED',
            sortBy: 'visitDate',
            sortDescending: true
        });
        console.log(`getPaginatedVisitData Result: Total=${result.total}, DataLength=${result.data.length}`);
        if (result.data.length > 0) {
            console.log("First item:", result.data[0]);
        }
    } catch (e) {
        console.error("getPaginatedVisitData failed:", e);
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
