import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAll() {
    // Delete all VisitData
    await prisma.visitData.deleteMany({});
    console.log('All VisitData records deleted!');

    // Delete all Seasons
    await prisma.season.deleteMany({});
    console.log('All Season records deleted!');

    await prisma.$disconnect();
}

await deleteAll()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());