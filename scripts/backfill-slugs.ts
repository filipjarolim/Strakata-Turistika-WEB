
import { PrismaClient } from '@prisma/client';
import slugify from '../lib/slugify-local';
// Since we are running this with node/ts-node, we might need to adjust import.
// Let's use a self-contained script to avoid import issues.

const prisma = new PrismaClient();

function simpleSlugify(text: string) {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function main() {
    console.log("Fetching news items without slugs...");
    // We can't query by slug=null easily if the client isn't generated yet or if schema differs.
    // Use $runCommandRaw or findMany and filter.
    // Actually, we can just fetch all and update if missing.

    const newsItems = await prisma.news.findMany();

    console.log(`Found ${newsItems.length} items. Updating slugs...`);

    for (const news of newsItems) {
        if (!news.slug) {
            const slug = simpleSlugify(news.title);
            // Ensure unique
            let counter = 1;
            let finalSlug = slug;
            while (await prisma.news.findFirst({ where: { slug: finalSlug, id: { not: news.id } } })) {
                finalSlug = `${slug}-${counter}`;
                counter++;
            }

            console.log(`Updating ${news.title} -> ${finalSlug}`);
            // Use updateMany to bypass potentially strict unique check validation in Client if any
            await prisma.news.update({
                where: { id: news.id },
                data: { slug: finalSlug }
            });
        }
    }
    console.log("Done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
