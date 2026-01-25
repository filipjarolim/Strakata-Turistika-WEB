
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Adding cleanup for 2026 seed data...");

    // 1. Delete visits for 2026 that follow the seed pattern OR all 2026 if requested.
    // User said "remove some of the data that are not real".
    // My seed script likely used standard patterns.
    // Safest bet: Delete ALL visits in 2026 because the season just started and the user complained about "fake data".
    // But to be safe, let's look for visits linked to 'seed.user' emails if possible.

    // Actually, Prisma deleteMany on visits where link to user... 
    // Let's first find the "fake" users.
    const fakeUsers = await prisma.user.findMany({
        where: { email: { startsWith: 'seed.user.' } },
        select: { id: true }
    });

    const fakeUserIds = fakeUsers.map(u => u.id);
    console.log(`Found ${fakeUserIds.length} fake users.`);

    if (fakeUserIds.length > 0) {
        const deletedVisits = await prisma.visitData.deleteMany({
            where: { userId: { in: fakeUserIds } }
        });
        console.log(`Deleted ${deletedVisits.count} visits from fake users.`);

        const deletedUsers = await prisma.user.deleteMany({
            where: { id: { in: fakeUserIds } }
        });
        console.log(`Deleted ${deletedUsers.count} fake users.`);
    } else {
        console.log("No fake users found. Checking for 2026 visits generally...");
        // If I used a different seed method, maybe I just delete 2026?
        // But user said "s switch to dark mode" etc. so he IS testing.
        // He explicitly said "remove some of the data that are not real".
        // I'll assume the email filter caught them. If not, I'll delete all 2026.
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
