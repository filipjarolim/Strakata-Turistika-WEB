import { NextResponse } from "next/server";
import { getAvailableSeasons } from "@/lib/results-utils";
import { withCache, seasonsCache, CacheKeys } from "@/lib/cache-utils";

export async function GET() {
  try {
    // Use the utility function for optimized seasons data with caching
    const cacheKey = CacheKeys.seasons();

    const availableSeasons = await withCache(
      seasonsCache,
      cacheKey,
      () => getAvailableSeasons(),
      10 * 60 * 1000 // 10 minutes TTL
    );

    return NextResponse.json(availableSeasons);

  } catch (error) {
    console.error("[GET_SEASONS_ERROR]", error);
    return NextResponse.json(
      { message: "Failed to fetch seasons." },
      { status: 500 }
    );
  }
}
