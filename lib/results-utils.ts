import { db } from "@/lib/db";
import { processVisitData, logDataValidationIssues } from "@/lib/data-validation";
import { getRawVisitData, getRawVisitDataCount, getRawSeasons } from "@/lib/mongodb-raw";

export interface VisitDataWithUser {
  id: string;
  visitDate: Date | null;
  routeTitle: string | null;
  points: number;
  visitedPlaces: string;
  dogNotAllowed: string | null;
  routeLink: string | null;
  year: number;
  seasonYear: number;
  extraPoints: any;
  state: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: Date | null;
  userId?: string;
  user?: {
    id: string;
    name: string | null;
    dogName: string | null;
    image: string | null;
  } | null;
  displayName: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userImage?: string;
  dogName?: string;
  totalPoints: number;
  visitsCount: number;
  lastVisitDate?: Date;
}

export interface PaginatedParams {
  page: number;
  limit: number;
  season: number;
  state?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  userId?: string;
  searchQuery?: string;
  sortBy: 'visitDate' | 'points' | 'routeTitle' | 'createdAt';
  sortDescending: boolean;
  minPoints?: number;
  maxPoints?: number;
  minDistance?: number;
  maxDistance?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Get paginated visit data with optimized queries
 */
export async function getPaginatedVisitData(
  params: PaginatedParams
): Promise<PaginatedResponse<VisitDataWithUser>> {
  const {
    page,
    limit,
    season,
    state = 'APPROVED',
    userId,
    searchQuery,
    sortBy,
    sortDescending,
    minPoints,
    maxPoints,
    minDistance,
    maxDistance
  } = params;

  try {
    // Try raw MongoDB query first to avoid Prisma type issues
    const mongoFilters: any = {
      seasonYear: season,
      state
    };

    if (userId) {
      mongoFilters.userId = userId;
    }

    if (searchQuery) {
      mongoFilters.$or = [
        { routeTitle: { $regex: searchQuery, $options: 'i' } },
        { visitedPlaces: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (minPoints !== undefined || maxPoints !== undefined) {
      mongoFilters.points = {};
      if (minPoints !== undefined) mongoFilters.points.$gte = minPoints;
      if (maxPoints !== undefined) mongoFilters.points.$lte = maxPoints;
    }

    const sortOrder = sortDescending ? -1 : 1;
    const mongoSort: any = {};
    mongoSort[sortBy] = sortOrder;

    const totalCount = await getRawVisitDataCount(mongoFilters);
    
    const visitData = await getRawVisitData(mongoFilters, {
      sort: mongoSort,
      skip: (page - 1) * limit,
      limit: limit
    });

    // Process and validate data
    logDataValidationIssues(visitData, 'getPaginatedVisitData');
    const transformedData: VisitDataWithUser[] = visitData.map(processVisitData);

    return {
      data: transformedData,
      total: totalCount,
      page,
      limit,
      hasMore: page * limit < totalCount,
      totalPages: Math.ceil(totalCount / limit)
    };

  } catch (error) {
    console.error('Error with raw MongoDB query, falling back to Prisma:', error);
    
    // Fallback to Prisma query (original implementation)
    const whereClause: any = {
      year: season,
      state
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (searchQuery) {
      whereClause.OR = [
        { routeTitle: { contains: searchQuery, mode: 'insensitive' } },
        { visitedPlaces: { contains: searchQuery, mode: 'insensitive' } }
      ];
    }

    if (minPoints !== undefined || maxPoints !== undefined) {
      whereClause.points = {};
      if (minPoints !== undefined) whereClause.points.gte = minPoints;
      if (maxPoints !== undefined) whereClause.points.lte = maxPoints;
    }

    // Build sort criteria
    const orderBy: any = {};
    orderBy[sortBy] = sortDescending ? 'desc' : 'asc';

    // Get total count for pagination
    const totalCount = await db.visitData.count({
      where: whereClause
    });

    // Get paginated data with user information
    const visitData = await db.visitData.findMany({
      where: whereClause,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        visitDate: true,
        routeTitle: true,
        points: true,
        visitedPlaces: true,
        dogNotAllowed: true,
        routeLink: true,
        year: true,
        extraPoints: true,
        state: true,
        rejectionReason: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            dogName: true,
            image: true
          }
        }
        // Exclude large fields: route, routeDescription, photos
      }
    });

    // Process and validate data
    logDataValidationIssues(visitData, 'getPaginatedVisitData');
    const transformedData: VisitDataWithUser[] = visitData.map(processVisitData);

    return {
      data: transformedData,
      total: totalCount,
      page,
      limit,
      hasMore: page * limit < totalCount,
      totalPages: Math.ceil(totalCount / limit)
    };
  }
}

/**
 * Get leaderboard data with aggregated statistics
 */
export async function getLeaderboard(
  season: number,
  page: number = 1,
  limit: number = 10000,
  searchQuery?: string,
  sortByVisits: boolean = false
): Promise<PaginatedResponse<LeaderboardEntry>> {
  
  // Get all approved visits for the season using raw MongoDB query
  const visits = await getRawVisitData({
    seasonYear: season,
    state: 'APPROVED'
  }, {
    sort: { visitDate: -1 }
  });

  // Data structure is now working correctly - debug logging removed

  // Process and validate data
  logDataValidationIssues(visits, 'getLeaderboard');
  const processedVisits = visits.map(processVisitData);

  // Group by user and aggregate data
  const userMap = new Map<string, LeaderboardEntry>();

  processedVisits.forEach((visit: VisitDataWithUser) => {
    // Use the displayName that was already processed with correct priority
    const groupKey = visit.userId || visit.displayName || 'unknown';
    
    if (!userMap.has(groupKey)) {
      userMap.set(groupKey, {
        userId: visit.userId || groupKey,
        userName: visit.displayName, // Use the already processed displayName
        userImage: visit.user?.image || undefined,
        dogName: visit.user?.dogName || undefined,
        totalPoints: 0,
        visitsCount: 0,
        lastVisitDate: undefined
      });
    }

    const entry = userMap.get(groupKey)!;
    entry.totalPoints += visit.points;
    entry.visitsCount += 1;
    
    if (!entry.lastVisitDate || (visit.visitDate && visit.visitDate > entry.lastVisitDate)) {
      entry.lastVisitDate = visit.visitDate || undefined;
    }
  });

  // Convert to array and sort
  let leaderboardEntries = Array.from(userMap.values());

  // Apply search filter if provided
  if (searchQuery) {
    leaderboardEntries = leaderboardEntries.filter(entry =>
      entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.dogName && entry.dogName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Sort by points or visits
  if (sortByVisits) {
    leaderboardEntries.sort((a, b) => {
      if (b.visitsCount !== a.visitsCount) {
        return b.visitsCount - a.visitsCount;
      }
      return b.totalPoints - a.totalPoints;
    });
  } else {
    leaderboardEntries.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.visitsCount - a.visitsCount;
    });
  }

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEntries = leaderboardEntries.slice(startIndex, endIndex);

  return {
    data: paginatedEntries,
    total: leaderboardEntries.length,
    page,
    limit,
    hasMore: endIndex < leaderboardEntries.length,
    totalPages: Math.ceil(leaderboardEntries.length / limit)
  };
}

/**
 * Get available seasons with visit counts
 */
export async function getAvailableSeasons(): Promise<number[]> {
  try {
    // Use raw MongoDB query to avoid Prisma type issues
    return await getRawSeasons();
  } catch (error) {
    console.error('Error getting seasons with raw query, falling back to Prisma:', error);
    
    // Fallback to Prisma query
    const seasons = await db.season.findMany({
      select: {
        year: true,
        _count: {
          select: {
            visitData: {
              where: {
                state: 'APPROVED'
              }
            }
          }
        }
      },
      orderBy: {
        year: 'desc'
      }
    });

    // Filter out seasons with no approved visits
    return seasons
      .filter(season => season._count.visitData > 0)
      .map(season => season.year);
  }
}

/**
 * Get user statistics for a specific season
 */
export async function getUserStats(userId: string, season: number): Promise<{
  totalPoints: number;
  visitsCount: number;
  lastVisitDate?: Date;
  averagePoints: number;
}> {
  const visits = await db.visitData.findMany({
    where: {
      userId,
      year: season,
      state: 'APPROVED'
    },
    select: {
      points: true,
      visitDate: true
    },
    orderBy: {
      visitDate: 'desc'
    }
  });

  const totalPoints = visits.reduce((sum, visit) => sum + visit.points, 0);
  const visitsCount = visits.length;
  const lastVisitDate = visits.length > 0 ? visits[0].visitDate : undefined;
  const averagePoints = visitsCount > 0 ? totalPoints / visitsCount : 0;

  return {
    totalPoints,
    visitsCount,
    lastVisitDate: lastVisitDate || undefined,
    averagePoints
  };
}

/**
 * Search visits with advanced filtering
 */
export async function searchVisits(params: {
  season: number;
  query: string;
  limit?: number;
  filters?: {
    minPoints?: number;
    maxPoints?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
    userId?: string;
  };
}): Promise<VisitDataWithUser[]> {
  const { season, query, limit = 50, filters = {} } = params;

  const whereClause: any = {
    year: season,
    state: 'APPROVED',
    OR: [
      { routeTitle: { contains: query, mode: 'insensitive' } },
      { visitedPlaces: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters.minPoints !== undefined || filters.maxPoints !== undefined) {
    whereClause.points = {};
    if (filters.minPoints !== undefined) whereClause.points.gte = filters.minPoints;
    if (filters.maxPoints !== undefined) whereClause.points.lte = filters.maxPoints;
  }

  if (filters.dateRange) {
    whereClause.visitDate = {
      gte: filters.dateRange.start,
      lte: filters.dateRange.end
    };
  }

  if (filters.userId) {
    whereClause.userId = filters.userId;
  }

  const visits = await db.visitData.findMany({
    where: whereClause,
    take: limit,
    orderBy: {
      visitDate: 'desc'
    },
    select: {
      id: true,
      visitDate: true,
      routeTitle: true,
      points: true,
      visitedPlaces: true,
      dogNotAllowed: true,
      routeLink: true,
      year: true,
      extraPoints: true,
      state: true,
      rejectionReason: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          dogName: true,
          image: true
        }
      }
    }
  });

  // Process and validate data
  logDataValidationIssues(visits, 'searchVisits');
  return visits.map(processVisitData);
}
