import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteSeasonData(years) {
    if (!Array.isArray(years) || years.length === 0) {
        console.error("No years provided. Please specify a valid list of years.");
        return;
    }

    for (const year of years) {
        console.log(`Processing year: ${year}`);

        try {
            // Find the season for the specified year
            const season = await prisma.season.findUnique({
                where: { year },
            });

            if (!season) {
                console.warn(`No season found for year ${year}.`);
                continue;
            }

            // Delete all VisitData associated with the season
            const visitDataDeleted = await prisma.visitData.deleteMany({
                where: { seasonId: season.id },
            });
            console.log(
                `Deleted ${visitDataDeleted.count} VisitData records for season ${year}.`
            );

            // Delete the Season itself
            await prisma.season.delete({
                where: { id: season.id },
            });
            console.log(`Season ${year} deleted.`);

        } catch (error) {
            console.error(`Failed to delete data for year ${year}:`, error);
        }
    }

    await prisma.$disconnect();
}

// Replace with the years you want to delete
const yearsToDelete = [2022];

await deleteSeasonData(yearsToDelete).catch((e) => console.error(e));