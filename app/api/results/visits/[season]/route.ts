import { NextResponse } from "next/server";
import { getPaginatedVisitData, PaginatedParams } from "@/lib/results-utils";
import { withCache, visitsCache, CacheKeys } from "@/lib/cache-utils";

type tParams = Promise<{ season: string }>;

export async function GET(request: Request, { params }: { params: tParams }) {
  const { season } = await params;
  const url = new URL(request.url);
  
  // Parse query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const state = url.searchParams.get('state') as 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' || 'APPROVED';
  const userId = url.searchParams.get('userId') || undefined;
  const searchQuery = url.searchParams.get('search') || undefined;
  const sortBy = (url.searchParams.get('sortBy') as 'visitDate' | 'points' | 'routeTitle' | 'createdAt') || 'visitDate';
  const sortDescending = url.searchParams.get('sortDesc') === 'true';
  const minPoints = url.searchParams.get('minPoints') ? parseInt(url.searchParams.get('minPoints')!) : undefined;
  const maxPoints = url.searchParams.get('maxPoints') ? parseInt(url.searchParams.get('maxPoints')!) : undefined;
  const minDistance = url.searchParams.get('minDistance') ? parseFloat(url.searchParams.get('minDistance')!) : undefined;
  const maxDistance = url.searchParams.get('maxDistance') ? parseFloat(url.searchParams.get('maxDistance')!) : undefined;

  try {
    const year = parseInt(season);

    if (isNaN(year)) {
      return NextResponse.json(
        { message: "Invalid season parameter." },
        { status: 400 }
      );
    }

    // Use the utility function for optimized data fetching
    const params: PaginatedParams = {
      page,
      limit,
      season: year,
      state,
      userId,
      searchQuery,
      sortBy,
      sortDescending,
      minPoints,
      maxPoints,
      minDistance,
      maxDistance
    };

    // Generate cache key and use cache
    const cacheKey = CacheKeys.visits(year, page, limit, {
      state,
      userId: userId || '',
      searchQuery: searchQuery || '',
      sortBy,
      sortDescending,
      minPoints: minPoints || '',
      maxPoints: maxPoints || '',
      minDistance: minDistance || '',
      maxDistance: maxDistance || ''
    });

    const response = await withCache(
      visitsCache,
      cacheKey,
      () => getPaginatedVisitData(params),
      2 * 60 * 1000 // 2 minutes TTL
    );

    console.log(`[VISITS_API] Season ${year}, Page ${page}, Limit ${limit}, Results: ${response.data.length} items, HasMore: ${response.hasMore}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET_PAGINATED_VISIT_DATA_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch visit data." },
      { status: 500 }
    );
  }
}
