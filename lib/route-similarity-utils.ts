import { db } from '@/lib/db';

export interface Point {
    lat: number;
    lng: number;
}

/**
 * Checks if a new route is too similar to existing user routes
 * 
 * @param userId User ID to check against
 * @param newTrack Array of lat/lng points for the new route
 * @param excludeVisitId Optional visit ID to exclude (e.g. when updating)
 */
export async function checkRouteSimilarity(
    userId: string,
    newTrack: Point[],
    excludeVisitId?: string
): Promise<{ isDuplicate: boolean; similarRoute?: string }> {
    if (!newTrack || newTrack.length < 5) {
        return { isDuplicate: false };
    }

    // Fetch user's approved or pending visits (non-deleted)
    const existingVisits = await db.visitData.findMany({
        where: {
            userId,
            id: excludeVisitId ? { not: excludeVisitId } : undefined,
            state: { in: ['PENDING_REVIEW', 'APPROVED'] },
            // In a real scenario, we'd also check if deletedAt is null if we implement soft deletes
        },
        select: { id: true, routeTitle: true, route: true }
    });

    for (const visit of existingVisits) {
        if (!visit.route) continue;

        try {
            // Assume visit.route is the JSON object { trackPoints: [...] }
            const routeData = (visit.route as unknown) as Record<string, unknown>;
            const existingPoints = (routeData.trackPoints as unknown) as Array<Record<string, number>> || [];

            if (!Array.isArray(existingPoints) || existingPoints.length < 5) continue;

            const existingTrack: Point[] = existingPoints.map((p) => ({
                lat: p.latitude || (p.lat as number),
                lng: p.longitude || (p.lng as number)
            }));

            const similarity = calculateTrackSimilarity(newTrack, existingTrack);

            if (similarity > 0.85) { // 85% similarity threshold
                return {
                    isDuplicate: true,
                    similarRoute: visit.routeTitle || visit.id
                };
            }
        } catch (e) {
            console.error(`Error comparing visit ${visit.id}:`, e);
            continue;
        }
    }

    return { isDuplicate: false };
}

/**
 * Calculates similarity between two tracks
 * Returns a score from 0 to 1 (1 = identical)
 */
function calculateTrackSimilarity(track1: Point[], track2: Point[]): number {
    // Threshold ~100m in decimal degrees (approximation)
    // 0.001 degrees latitude is about 111 meters
    const threshold = 0.001;

    // To prevent O(N*M) being too slow for very long tracks, we can downsample or use a spatial index
    // For our use case, we'll downsample if track is too long
    const downsample = (t: Point[]) => {
        if (t.length <= 100) return t;
        const step = Math.floor(t.length / 100);
        return t.filter((_, i) => i % step === 0);
    };

    const sampled1 = downsample(track1);
    const sampled2 = downsample(track2);

    let matchingPoints = 0;

    for (const p1 of sampled1) {
        const hasNearby = sampled2.some(p2 => {
            const dLat = p1.lat - p2.lat;
            const dLng = p1.lng - p2.lng;
            // Simple Euclidean distance for small areas
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            return dist < threshold;
        });

        if (hasNearby) {
            matchingPoints++;
        }
    }

    return matchingPoints / sampled1.length;
}
