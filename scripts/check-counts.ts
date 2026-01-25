
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.count();
    const visits = await prisma.visitData.count();
    const seasons = await prisma.season.count();
    const news = await prisma.news.count();
    console.log(`Users: ${users}`);
    console.log(`Visits: ${visits}`);
    console.log(`Seasons: ${seasons}`);
    console.log(`News: ${news}`);
}
main().finally(() => prisma.$disconnect());
