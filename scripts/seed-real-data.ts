
import { PrismaClient } from '@prisma/client';
import { fakerCS_CZ as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding realistic data...");

    // 1. Seed Users (15 users)
    const users = [];
    for (let i = 0; i < 15; i++) {
        const email = `seed.user.${i}@example.com`;
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: faker.person.fullName(),
                    email,
                    role: 'UZIVATEL',
                    dogName: faker.person.firstName(), // Dog name
                    image: faker.image.avatar()
                }
            });
        }
        users.push(user);
    }
    console.log(`Ensured ${users.length} seed users.`);

    // 2. Seed News (10 items)
    const tags = ['Soutěž', 'Tipy', 'Novinky', 'Událost'];
    const newsTitles = [
        "Zahájení sezóny 2026 je tady!",
        "Jak správně fotit na vrcholech?",
        "Velká jarní výzva startuje",
        "Novinky v pravidlech pro tento rok",
        "Nejlepší trasy pro začátečníky",
        "Sraz strakatých turistů v Beskydech",
        "Fotosoutěž: Můj pes a hory",
        "Technické problémy s nahráváním fotek",
        "Tipy na výlety v Krkonoších",
        "Ukončení zimní části sezóny"
    ];

    for (let i = 0; i < 10; i++) {
        const title = newsTitles[i];
        const slug = faker.helpers.slugify(title).toLowerCase();

        // Check if exists
        const exists = await prisma.news.findFirst({ where: { OR: [{ title }, { slug }] } });
        if (!exists) {
            await prisma.news.create({
                data: {
                    title,
                    slug,
                    content: `<h2>${title}</h2><p>${faker.lorem.paragraphs(3)}</p><blockquote>${faker.lorem.sentence()}</blockquote><p>${faker.lorem.paragraph()}</p>`,
                    summary: faker.lorem.sentences(2),
                    published: true,
                    tags: faker.helpers.arrayElements(tags, { min: 1, max: 2 }),
                    createdAt: faker.date.recent({ days: 60 }),
                    authorId: users[0].id // assign to first user
                }
            });
        }
    }
    console.log("Seeded News.");

    // 3. Seed Visits for 2026 (200 visits)
    // We want a nice leaderboard distribution.
    // Some users should be active (many visits), others less.

    // Create/Ensure Season 2026
    let season2026 = await prisma.season.findUnique({ where: { year: 2026 } });
    if (!season2026) {
        season2026 = await prisma.season.create({ data: { year: 2026 } });
    }

    const currentVisitsCount = await prisma.visitData.count({ where: { year: 2026 } });
    if (currentVisitsCount < 50) {
        console.log("Seeding visits for 2026...");
        const places = ["Sněžka", "Praděd", "Lysá hora", "Říp", "Bezděz", "Ještěd", "Velká Deštná", "Klínovac", "Smrk", "Pravčická brána"];

        for (const user of users) {
            // Random activity level: 1 to 20 visits
            const visitCount = faker.number.int({ min: 1, max: 20 });

            for (let j = 0; j < visitCount; j++) {
                const points = faker.number.int({ min: 5, max: 50 });
                const place = faker.helpers.arrayElement(places);

                await prisma.visitData.create({
                    data: {
                        userId: user.id,
                        year: 2026,
                        seasonId: season2026.id,
                        points,
                        visitedPlaces: place,
                        visitDate: faker.date.recent({ days: 90 }), // last 3 months
                        routeTitle: `Výlet na ${place}`,
                        routeDescription: faker.lorem.sentence(),
                        state: 'APPROVED',
                        extraPoints: {}, // dummy
                        createdAt: new Date(),
                        // We can add dummy track points for the map preview
                        route: {
                            trackPoints: generateDummyTrack()
                        }
                    }
                });
            }
        }
        console.log("Seeded 2026 visits.");
    } else {
        console.log("2026 already has enough data.");
    }

}

function generateDummyTrack() {
    // Generate a simple circular path or random walk
    const centerLat = 50.0;
    const centerLon = 14.5;
    const points = [];
    for (let i = 0; i < 20; i++) {
        points.push({
            latitude: centerLat + (Math.random() - 0.5) * 0.01,
            longitude: centerLon + (Math.random() - 0.5) * 0.01,
        });
    }
    return points;
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
