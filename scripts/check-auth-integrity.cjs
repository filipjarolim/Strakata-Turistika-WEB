
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('st');
        const usersCollection = db.collection('users');
        const accountsCollection = db.collection('accounts');

        // Get all valid user IDs
        const users = await usersCollection.find({}, { projection: { _id: 1 } }).toArray();
        const userIds = new Set(users.map(u => u._id.toString()));
        console.log(`Found ${userIds.size} users`);

        // Check accounts
        const accounts = await accountsCollection.find({}).toArray();
        console.log(`Found ${accounts.length} accounts`);

        let orphanedCount = 0;

        for (const account of accounts) {
            if (!account.userId) {
                console.warn(`Account ${account._id} has no userId`);
                continue;
            }

            if (!userIds.has(account.userId.toString())) {
                console.warn(`Orphaned account found: ${account._id} (Provider: ${account.provider}) points to missing user ${account.userId}`);

                // Delete the orphaned account
                await accountsCollection.deleteOne({ _id: account._id });
                console.log(`Deleted orphaned account ${account._id}`);
                orphanedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${orphanedCount} orphaned accounts.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

main();
