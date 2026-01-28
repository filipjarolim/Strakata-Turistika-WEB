import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Image Migration...");

    // 1. Migrate Visit Photos (using findRaw to bypass validation errors)
    const rawVisits = await prisma.visitData.findRaw({
        filter: {
            photos: { $ne: null }
        }
    }) as unknown as any[];

    console.log(`Found ${rawVisits.length} visits with photos (raw).`);

    for (const visit of rawVisits) {
        const photos = visit.photos;
        if (!Array.isArray(photos)) continue;

        // Extract string ID from BSON object or string
        const visitId = visit._id?.$oid || visit._id;
        if (!visitId) continue;

        for (const photo of photos) {
            if (!photo.url || !photo.public_id) continue;

            // Check if exists
            const existing = await prisma.image.findFirst({
                where: { publicId: photo.public_id }
            });

            if (!existing) {
                await prisma.image.create({
                    data: {
                        url: photo.url,
                        publicId: photo.public_id,
                        title: photo.title || undefined,
                        visitId: visitId.toString(),
                        isGalleryVisible: false // Default to hidden
                    }
                });
                console.log(`Created Image for Visit ${visitId}: ${photo.public_id}`);
            } else {
                // If exists but no relation, maybe update?
                if (!existing.visitId) {
                    await prisma.image.update({
                        where: { id: existing.id },
                        data: { visitId: visitId.toString() }
                    });
                    console.log(`Linked Image ${existing.id} to Visit ${visitId}`);
                }
            }
        }
    }

    // 2. Migrate News Images
    const newsList = await prisma.news.findMany({
        where: {
            images: { not: null }
        }
    });

    console.log(`Found ${newsList.length} news items with images.`);

    for (const news of newsList) {
        const images = news.images as any[];
        if (!Array.isArray(images)) continue;

        for (const img of images) {
            if (!img.url || !img.public_id) continue;

            const existing = await prisma.image.findFirst({
                where: { publicId: img.public_id }
            });

            if (!existing) {
                await prisma.image.create({
                    data: {
                        url: img.url,
                        publicId: img.public_id,
                        title: img.title || undefined,
                        newsId: news.id,
                        isGalleryVisible: true // News images are usually public
                    }
                });
                console.log(`Created Image for News ${news.id}: ${img.public_id}`);
            } else {
                if (!existing.newsId) {
                    await prisma.image.update({
                        where: { id: existing.id },
                        data: { newsId: news.id }
                    });
                    console.log(`Linked Image ${existing.id} to News ${news.id}`);
                }
            }
        }
    }

    console.log("Migration complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
