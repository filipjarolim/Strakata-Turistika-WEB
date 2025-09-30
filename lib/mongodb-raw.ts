/**
 * Raw MongoDB queries to bypass Prisma type conversion issues
 * This handles cases where data types in the database don't match Prisma schema expectations
 */

import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

async function getMongoClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }
    client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    db = client.db();
  }
  
  // Ensure db is available even if client exists but db is null
  if (!db && client) {
    db = client.db();
  }
  
  if (!db) {
    throw new Error('Failed to get database connection');
  }
  
  return { client, db };
}

export async function getRawVisitData(filters: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { db } = await getMongoClient();
  
  const pipeline = [
    { $match: filters },
    {
      $lookup: {
        from: 'User',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    // Debug: Add a field to see what userId looks like
    {
      $addFields: {
        debugUserId: '$userId',
        debugUserArray: '$user'
      }
    },
    {
      $addFields: {
        user: { $first: '$user' },
        // Ensure we have both year and seasonYear fields for compatibility
        year: { $ifNull: ['$year', '$seasonYear'] },
        seasonYear: { $ifNull: ['$seasonYear', '$year'] }
      }
    },
    // Project only the fields we need and normalize field names
    {
      $project: {
        id: '$_id',           // Map _id to id for Prisma compatibility
        _id: 1,               // Keep original _id as well
        visitDate: 1,
        createdAt: 1,
        points: 1,
        year: 1,
        seasonYear: 1,
        routeTitle: 1,
        visitedPlaces: 1,
        dogNotAllowed: 1,
        routeLink: 1,
        extraPoints: 1,
        state: 1,
        rejectionReason: 1,
        userId: 1,
        user: {
          id: '$user._id',    // Map user._id to user.id
          _id: '$user._id',   // Keep original _id
          name: '$user.name',
          dogName: '$user.dogName',
          image: '$user.image'
        },
        debugUserId: 1,
        debugUserArray: 1
        // Exclude large fields: route, routeDescription, photos
      }
    },
    ...(options.sort ? [{ $sort: options.sort }] : []),
    ...(options.skip ? [{ $skip: options.skip }] : []),
    ...(options.limit ? [{ $limit: options.limit }] : [])
  ];

  return await db.collection('VisitData').aggregate(pipeline).toArray();
}

export async function getRawVisitDataCount(filters: Record<string, unknown>) {
  const { db } = await getMongoClient();
  return await db.collection('VisitData').countDocuments(filters);
}

export async function getRawSeasons() {
  const { db } = await getMongoClient();
  
  const pipeline = [
    {
      $lookup: {
        from: 'VisitData',
        localField: '_id',
        foreignField: 'seasonId',
        as: 'visitData'
      }
    },
    {
      $addFields: {
        approvedVisits: {
          $size: {
            $filter: {
              input: '$visitData',
              cond: { $eq: ['$$this.state', 'APPROVED'] }
            }
          }
        }
      }
    },
    {
      $match: {
        approvedVisits: { $gt: 0 }
      }
    },
    {
      $sort: { year: -1 }
    },
    {
      $project: { year: 1 }
    }
  ];

  const seasons = await db.collection('Season').aggregate(pipeline).toArray();
  return seasons.map((s) => (s as { year: number }).year);
}

// Close connection when needed
export async function closeMongoConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
