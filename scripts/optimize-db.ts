
import { MongoClient } from 'mongodb';
import 'dotenv/config'; // Load env vars


async function main() {
    if (!process.env.DATABASE_URL) throw new Error("No DATABASE_URL");
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    const db = client.db();

    console.log("Creating indexes for optimization...");

    // Visits - Core indexes for filtering
    await db.collection('visits').createIndex({ year: 1, state: 1 });
    await db.collection('visits').createIndex({ seasonYear: 1, state: 1 });
    await db.collection('visits').createIndex({ userId: 1 }); // For finding user's visits
    await db.collection('visits').createIndex({ seasonId: 1 }); // For joining with Season

    // Users
    await db.collection('users').createIndex({ email: 1 });

    console.log("Indexes created successfully.");
    await client.close();
}

main().catch(console.error);
