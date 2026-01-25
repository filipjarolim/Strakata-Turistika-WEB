
import { PrismaClient } from '@prisma/client';
import { fakerCS_CZ as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding MORE visits (only visits)...");

    // Fetch existing users
    const users = await prisma.user.findMany({ take: 20 });
    if (users.length === 0) {
        console.log("No users found to attach visits to.");
        return;
    }

    // Ensure Season 2026
    let season2026 = await prisma.season.findUnique({ where: { year: 2026 } });
    if (!season2026) {
        season2026 = await prisma.season.create({ data: { year: 2026 } });
    }

    // Seed 300 more visits
    const places = ["Sněžka", "Praděd", "Lysá hora", "Říp", "Bezděz", "Ještěd", "Velká Deštná", "Klínovac", "Smrk", "Pravčická brána", "Radhošť", "Hostýn"];

    console.log(`Generating 300 visits for ${users.length} users...`);

    for (let i = 0; i < 300; i++) {
        const user = faker.helpers.arrayElement(users);
        const points = faker.number.int({ min: 5, max: 50 });
        const place = faker.helpers.arrayElement(places);

        await prisma.visitData.create({
            data: {
                userId: user.id,
                year: 2026,
                seasonId: season2026.id,
                points,
                visitedPlaces: place,
                visitDate: faker.date.recent({ days: 120 }),
                routeTitle: `Výlet na ${place} - ${faker.word.adjective()}`,
                routeDescription: faker.lorem.sentence(),
                state: 'APPROVED',
                extraPoints: {},
                createdAt: new Date(),
                // Add simple route
                route: {
                    trackPoints: [{ latitude: 50, longitude: 14 }] // Minimal mock
                }
            }
        });

        if (i % 50 === 0) console.log(`Generated ${i} visits...`);
    }

    console.log("Done seeding visits.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
