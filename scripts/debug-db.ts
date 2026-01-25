
import { db } from '../lib/db';

async function main() {
  console.log("Checking DB connection with URL:", process.env.DATABASE_URL?.substring(0, 20) + "...");
  try {
    console.log("Fetching news count...");
    const count = await db.news.count();
    console.log("News count:", count);
    
    console.log("Fetching first news item...");
    const news = await db.news.findMany({ take: 1 });
    console.log("First news item:", JSON.stringify(news, null, 2));
  } catch (err) {
    console.error("Error accessing DB:");
    console.error(err);
  } finally {
    await db.$disconnect();
  }
}

main();
