import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/results-utils";
import { withCache, leaderboardCache, CacheKeys } from "@/lib/cache-utils";

type tParams = Promise<{ season: string }>;

export async function GET(request: Request, { params }: { params: tParams }) {
  const { season } = await params;
  const url = new URL(request.url);
  
  // Parse query parameters
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10000'); // Large limit to get all users
  const searchQuery = url.searchParams.get('search') || undefined;
  const sortByVisits = url.searchParams.get('sortByVisits') === 'true';

  try {
    const year = parseInt(season);

    if (isNaN(year)) {
      return NextResponse.json(
        { message: "Invalid season parameter." },
        { status: 400 }
      );
    }

    // Use the utility function for optimized leaderboard data
    const cacheKey = CacheKeys.leaderboard(year, sortByVisits, searchQuery);

    const response = await withCache(
      leaderboardCache,
      cacheKey,
      () => getLeaderboard(year, page, limit, searchQuery, sortByVisits),
      5 * 60 * 1000 // 5 minutes TTL
    );

    console.log(`[LEADERBOARD_API] Season ${year}, Page ${page}, Limit ${limit}, Results: ${response.data.length} items, HasMore: ${response.hasMore}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET_LEADERBOARD_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch leaderboard data." },
      { status: 500 }
    );
  }
}
