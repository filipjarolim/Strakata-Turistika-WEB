
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Backfilling published status...");

    // Update all news items to be published: true if not set
    // Since we want them visible, let's just set all to true for now.

    const count = await prisma.news.count();
    console.log(`Found ${count} news items.`);

    // We update all. In Mongo we can use updateMany.
    const result = await prisma.news.updateMany({
        data: {
            published: true
        }
    });

    console.log(`Updated ${result.count} items to published: true`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
