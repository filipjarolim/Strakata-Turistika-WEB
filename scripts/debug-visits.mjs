import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const uri = process.env.DATABASE_URL;

if (!uri) {
    console.error('DATABASE_URL is not defined in .env file');
    process.exit(1);
}

async function debugVisits() {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        console.log('Connected. Querying VisitData collection...');

        // Get total count
        const totalCount = await db.collection('VisitData').countDocuments();
        console.log(`Total VisitData documents: ${totalCount}`);

        // Get sample documents
        const samples = await db.collection('VisitData').find({}).limit(5).toArray();

        console.log('\nSample VisitData documents (first 5):');
        samples.forEach((doc, index) => {
            console.log(`\nDoc ${index + 1}:`);
            console.log(`  _id: ${doc._id}`);
            console.log(`  year: ${doc.year} (type: ${typeof doc.year})`);
            console.log(`  seasonYear: ${doc.seasonYear} (type: ${typeof doc.seasonYear})`);
            console.log(`  state: ${doc.state}`);
            console.log(`  routeTitle: ${doc.routeTitle}`);
            console.log(`  visitDate: ${doc.visitDate}`);
            console.log(`  hasRoute: ${!!doc.route}`);
        });

        // Check specifically for APPROVED visits in 2025
        console.log('\nChecking for APPROVED visits in 2025...');

        // Check with 'year' field
        const countYear2025 = await db.collection('VisitData').countDocuments({
            year: 2025,
            state: 'APPROVED'
        });
        console.log(`Count with { year: 2025, state: 'APPROVED' }: ${countYear2025}`);

        // Check with 'seasonYear' field
        const countSeasonYear2025 = await db.collection('VisitData').countDocuments({
            seasonYear: 2025,
            state: 'APPROVED'
        });
        console.log(`Count with { seasonYear: 2025, state: 'APPROVED' }: ${countSeasonYear2025}`);

    } catch (error) {
        console.error('Error debugging visits:', error);
    } finally {
        await client.close();
    }
}

debugVisits();
