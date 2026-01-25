
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("FORCE DELETING ALL 2026 DATA...");

    // Check if season 2026 exists
    const seasons2026 = await prisma.season.findMany({
        where: { year: 2026 }
    });

    // Delete all visits with year=2026
    const deletedVisits = await prisma.visitData.deleteMany({
        where: { year: 2026 }
    });

    console.log(`Deleted ${deletedVisits.count} visits from 2026.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
