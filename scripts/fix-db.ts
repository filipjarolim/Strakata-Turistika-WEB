
import { PrismaClient } from '@prisma/client';
import slugify from './lib/slugify-local.js';

const prisma = new PrismaClient();

function simpleSlugify(text) {
    if (!text) return 'untitled';
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

async function main() {
    console.log("Starting DB fix...");

    // 1. Fix News
    const newsItems = await prisma.news.findMany();
    console.log(`Checking ${newsItems.length} news items...`);
    for (const news of newsItems) {
        let needsUpdate = false;
        const updateData: any = {};

        if (!news.slug) {
            let slug = simpleSlugify(news.title);
            let counter = 1;
            let finalSlug = slug;
            while (await prisma.news.findFirst({ where: { slug: finalSlug, id: { not: news.id } } })) {
                finalSlug = `${slug}-${counter}`;
                counter++;
            }
            updateData.slug = finalSlug;
            needsUpdate = true;
        }

        if (!news.updatedAt) {
            updateData.updatedAt = news.createdAt || new Date();
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Fixing News: ${news.title}`);
            await prisma.news.update({ where: { id: news.id }, data: updateData });
        }
    }

    // 2. Fix FormFields (name must be unique and non-null)
    // Select only needed fields to avoid DateTime parsing errors on malformed records
    const formFields = await prisma.formField.findMany({
        select: { id: true, name: true, label: true }
    });
    console.log(`Checking ${formFields.length} form fields...`);
    for (const field of formFields) {
        if (!field.name) {
            let baseName = simpleSlugify(field.label || 'field');
            let counter = 1;
            let finalName = baseName;

            while (await prisma.formField.findFirst({ where: { name: finalName, id: { not: field.id } } })) {
                finalName = `${baseName}_${counter}`;
                counter++;
            }

            console.log(`Fixing FormField: ID ${field.id} -> name: ${finalName}`);
            await prisma.formField.update({
                where: { id: field.id },
                data: { name: finalName },
                select: { id: true, name: true }
            });
        }
    }

    console.log("DB Fix Done.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
