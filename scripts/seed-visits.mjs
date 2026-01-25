import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';

dotenv.config({ path: '.env' });

const uri = process.env.DATABASE_URL;

if (!uri) {
    console.error('DATABASE_URL is not defined');
    process.exit(1);
}

// Sample route track points (Prague area)
const SAMPLE_ROUTE = {
    trackPoints: [
        { latitude: 50.0755, longitude: 14.4378 }, // Museum
        { latitude: 50.0760, longitude: 14.4360 },
        { latitude: 50.0780, longitude: 14.4340 },
        { latitude: 50.0790, longitude: 14.4320 },
        { latitude: 50.0800, longitude: 14.4300 }, // Charles Bridge
        { latitude: 50.0850, longitude: 14.4250 },
        { latitude: 50.0880, longitude: 14.4200 }, // Castle
    ]
};

async function seedData() {
    console.log('Starting seed...');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        // 1. Get or Create a Test User
        let user = await db.collection('User').findOne({ email: 'test@example.com' });
        if (!user) {
            console.log('Creating test user...');
            const result = await db.collection('User').insertOne({
                name: 'Test Walker',
                email: 'test@example.com',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                dogName: 'Rex',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            user = { _id: result.insertedId };
        }

        // 2. Create Visits for 2025
        const visits = [];
        const seasons = [2024, 2025];

        for (const season of seasons) {
            console.log(`Generating visits for season ${season}...`);

            // Create Season document if not exists
            await db.collection('Season').updateOne(
                { year: season },
                {
                    $setOnInsert: {
                        name: `Sezóna ${season}`,
                        startDate: new Date(`${season}-01-01`),
                        endDate: new Date(`${season}-12-31`),
                        isActive: season === 2025
                    }
                },
                { upsert: true }
            );

            const seasonDoc = await db.collection('Season').findOne({ year: season });

            // Generate 10 visits per season
            for (let i = 0; i < 10; i++) {
                const visitDate = faker.date.between({ from: `${season}-01-01`, to: `${season}-12-31` });

                visits.push({
                    userId: user._id,
                    seasonId: seasonDoc._id,
                    year: season, // Prisma field
                    seasonYear: season, // Raw field
                    state: 'APPROVED',
                    routeTitle: `Výlet: ${faker.location.city()} - ${faker.location.street()}`,
                    visitDate: visitDate,
                    createdAt: visitDate,
                    updatedAt: visitDate,
                    points: faker.number.int({ min: 10, max: 100 }),
                    visitedPlaces: `${faker.location.city()}, ${faker.location.city()}`,
                    dogNotAllowed: faker.datatype.boolean(),
                    route: SAMPLE_ROUTE, // Add route data
                    routeLink: 'https://mapy.cz/s/randome',
                    photos: [],
                    places: []
                });
            }
        }

        console.log(`Inserting ${visits.length} visits...`);
        await db.collection('VisitData').insertMany(visits);
        console.log('Seed complete!');

    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await client.close();
    }
}

seedData();
