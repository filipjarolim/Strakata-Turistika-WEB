
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Syncing Seasons from VisitData...");

    // 1. Get all distinct years from VisitData
    // aggregation might be slow or unsupported on some mongo versions with prisma, 
    // but distinct is supported in findMany if we fetch fields.
    // However, findMany distinct returns the objects.
    // groupBy is better.

    // Fallback: fetch distinct years
    const distinctyears = await prisma.visitData.findMany({
        distinct: ['year'],
        select: { year: true },
    });

    const visitYears = distinctyears.map(v => v.year).filter(y => y !== null && y !== undefined);
    console.log(`Found years in VisitData: ${visitYears.join(', ')}`);

    // 2. Get existing Seasons
    const existingSeasons = await prisma.season.findMany({
        select: { year: true }
    });
    const seasonYears = new Set(existingSeasons.map(s => s.year));
    console.log(`Found existing Seasons: ${Array.from(seasonYears).join(', ')}`);

    // 3. Create missing Seasons
    let createdCount = 0;
    for (const year of visitYears) {
        if (!seasonYears.has(year)) {
            console.log(`Creating missing Season object for ${year}...`);
            await prisma.season.create({
                data: {
                    year: year
                }
            });
            createdCount++;
        }
    }

    console.log(`Synced! Created ${createdCount} new Season records.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
