
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanNews() {
    console.log("Fetching news...");
    const allNews = await prisma.news.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${allNews.length} news items.`);

    // Keep the 3 oldest
    const toKeep = allNews.slice(0, 3);
    const toDelete = allNews.slice(3);

    console.log(`Keeping ${toKeep.length} oldest items:`);
    toKeep.forEach(n => console.log(`- [KEEP] ${n.title} (${n.createdAt})`));

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} newer items...`);
        const deleteIds = toDelete.map(n => n.id);
        await prisma.news.deleteMany({
            where: {
                id: { in: deleteIds }
            }
        });
        console.log("Deletion complete.");
    } else {
        console.log("Nothing to delete.");
    }
}

cleanNews()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
