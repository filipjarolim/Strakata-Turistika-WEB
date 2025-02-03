import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAll() {
    await prisma.visitData.deleteMany({});
    console.log("All records deleted!");
    await prisma.$disconnect();
}

await deleteAll();
