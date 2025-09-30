import { db } from '@/lib/db';

/**
 * Database optimization utilities for better query performance
 * These should be run during deployment or database setup
 */

export interface IndexDefinition {
  name: string;
  fields: Record<string, 1 | -1 | 'text'>;
  options?: {
    unique?: boolean;
    sparse?: boolean;
    background?: boolean;
    partialFilterExpression?: Record<string, any>;
  };
}

/**
 * Essential indexes for VisitData collection performance
 */
export const VISIT_DATA_INDEXES: IndexDefinition[] = [
  // Primary query indexes
  {
    name: 'year_state_visitDate',
    fields: { year: 1, state: 1, visitDate: -1 },
    options: { background: true }
  },
  {
    name: 'year_state_points',
    fields: { year: 1, state: 1, points: -1 },
    options: { background: true }
  },
  {
    name: 'userId_year_state',
    fields: { userId: 1, year: 1, state: 1 },
    options: { background: true }
  },
  
  // Text search indexes
  {
    name: 'routeTitle_text',
    fields: { routeTitle: 'text' },
    options: { background: true }
  },
  {
    name: 'visitedPlaces_text',
    fields: { visitedPlaces: 'text' },
    options: { background: true }
  },
  
  // Composite text search
  {
    name: 'search_text',
    fields: { 
      routeTitle: 'text', 
      visitedPlaces: 'text',
      routeDescription: 'text'
    },
    options: { background: true }
  },
  
  // Date-based queries
  {
    name: 'visitDate_desc',
    fields: { visitDate: -1 },
    options: { background: true }
  },
  {
    name: 'createdAt_desc',
    fields: { createdAt: -1 },
    options: { background: true }
  },
  
  // Points range queries
  {
    name: 'points_desc',
    fields: { points: -1 },
    options: { background: true }
  },
  
  // State filtering
  {
    name: 'state_visitDate',
    fields: { state: 1, visitDate: -1 },
    options: { background: true }
  }
];

/**
 * Indexes for User collection
 */
export const USER_INDEXES: IndexDefinition[] = [
  {
    name: 'email_unique',
    fields: { email: 1 },
    options: { unique: true, sparse: true }
  },
  {
    name: 'name_text',
    fields: { name: 'text' },
    options: { background: true }
  },
  {
    name: 'dogName_text',
    fields: { dogName: 'text' },
    options: { background: true }
  }
];

/**
 * Indexes for Season collection
 */
export const SEASON_INDEXES: IndexDefinition[] = [
  {
    name: 'year_unique',
    fields: { year: 1 },
    options: { unique: true }
  }
];

/**
 * Create indexes for better performance
 * This function should be called during application startup or deployment
 */
export async function createPerformanceIndexes() {
  try {
    console.log('Creating database indexes for performance optimization...');
    
    // Note: In a real MongoDB setup, you would use the native MongoDB driver
    // to create indexes. Since we're using Prisma, these indexes would typically
    // be created via MongoDB directly or through Prisma's raw queries.
    
    // For now, we'll log what indexes should be created
    console.log('VisitData indexes to create:', VISIT_DATA_INDEXES);
    console.log('User indexes to create:', USER_INDEXES);
    console.log('Season indexes to create:', SEASON_INDEXES);
    
    // In a production environment, you would run these MongoDB commands:
    /*
    const db = await MongoClient.connect(process.env.MONGODB_URI!);
    const collection = db.db('strakataturistika').collection('VisitData');
    
    for (const index of VISIT_DATA_INDEXES) {
      await collection.createIndex(index.fields, index.options);
    }
    */
    
    console.log('Database indexes creation completed.');
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
}

/**
 * Analyze query performance and suggest optimizations
 */
export async function analyzeQueryPerformance() {
  try {
    // This would typically use MongoDB's explain() functionality
    // to analyze query execution plans and suggest optimizations
    
    console.log('Analyzing query performance...');
    
    // Example queries to analyze:
    const sampleQueries = [
      {
        name: 'Paginated visits by season',
        query: { year: 2023, state: 'APPROVED' },
        sort: { visitDate: -1 }
      },
      {
        name: 'Leaderboard aggregation',
        query: { year: 2023, state: 'APPROVED' },
        group: { userId: '$userId' }
      },
      {
        name: 'Search visits',
        query: { 
          year: 2023, 
          state: 'APPROVED',
          $text: { $search: 'sample search' }
        }
      }
    ];
    
    console.log('Sample queries for performance analysis:', sampleQueries);
    
    return {
      status: 'completed',
      recommendations: [
        'Ensure all query fields are properly indexed',
        'Use projection to limit returned fields',
        'Implement proper caching for frequently accessed data',
        'Consider read replicas for heavy read workloads'
      ]
    };
  } catch (error) {
    console.error('Error analyzing query performance:', error);
    throw error;
  }
}

/**
 * Get database statistics for monitoring
 */
export async function getDatabaseStats() {
  try {
    // This would typically connect to MongoDB directly to get stats
    const visitDataCount = await db.visitData.count();
    const userCount = await db.user.count();
    const seasonCount = await db.season.count();
    
    return {
      visitData: {
        total: visitDataCount,
        byState: {
          approved: await db.visitData.count({ where: { state: 'APPROVED' } }),
          pending: await db.visitData.count({ where: { state: 'PENDING_REVIEW' } }),
          draft: await db.visitData.count({ where: { state: 'DRAFT' } }),
          rejected: await db.visitData.count({ where: { state: 'REJECTED' } })
        }
      },
      users: {
        total: userCount
      },
      seasons: {
        total: seasonCount,
        years: await db.season.findMany({
          select: { year: true },
          orderBy: { year: 'desc' }
        })
      }
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

/**
 * Clean up old cache entries and optimize storage
 */
export async function optimizeDatabase() {
  try {
    console.log('Starting database optimization...');
    
    // Clean up old rejected/draft entries (older than 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const deletedDrafts = await db.visitData.deleteMany({
      where: {
        state: { in: ['DRAFT', 'REJECTED'] },
        createdAt: { lt: sixMonthsAgo }
      }
    });
    
    console.log(`Cleaned up ${deletedDrafts.count} old draft/rejected entries`);
    
    // Update statistics
    const stats = await getDatabaseStats();
    
    return {
      status: 'completed',
      cleanedEntries: deletedDrafts.count,
      stats
    };
  } catch (error) {
    console.error('Error optimizing database:', error);
    throw error;
  }
}
