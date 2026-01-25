
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking legacy visit states and links...");

    const checkYear = 2023; // example

    // Check count
    const total = await prisma.visitData.count({ where: { year: checkYear } });

    // Check states
    const states = await prisma.visitData.groupBy({
        by: ['state'],
        where: { year: checkYear },
        _count: { id: true }
    });
    console.log(`${checkYear} State Distribution:`, states);

    // Check seasonId linkage
    const linked = await prisma.visitData.count({
        where: { year: checkYear, seasonId: { not: null } }
    });
    const unlinked = await prisma.visitData.count({
        where: { year: checkYear, seasonId: null }
    });
    console.log(`${checkYear} Linkage: Linked=${linked}, Unlinked=${unlinked}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
