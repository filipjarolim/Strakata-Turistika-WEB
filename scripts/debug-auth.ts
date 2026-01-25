
import { db } from '../lib/db';

async function main() {
    try {
        console.log("Fetching accounts with users...");
        const accounts = await db.account.findMany({
            include: {
                user: true
            }
        });

        console.log(`Successfully fetched ${accounts.length} accounts.`);
        accounts.forEach(acc => {
            console.log(`- Account ${acc.id} (User: ${acc.user?.name || acc.userId})`);
        });

    } catch (err) {
        console.error("Error accessing DB:");
        console.error(err);
    } finally {
        await db.$disconnect();
    }
}

main();
