/**
 * Scoring utilities for automatic point calculation
 * Based on mobile app logic
 */

export interface ScoringConfig {
  pointsPerKm: number;
  minDistanceKm: number;
  requireAtLeastOnePlace: boolean;
  placeTypePoints: {
    PEAK?: number;
    TOWER?: number;
    TREE?: number;
    OTHER?: number;
    [key: string]: number | undefined;
  };
}

export interface Place {
  id: string;
  name: string;
  type: 'PEAK' | 'TOWER' | 'TREE' | 'OTHER';
  photos: Array<{
    id: string;
    url: string;
    public_id?: string;
    title?: string;
    description?: string;
    uploadedAt: string;
    isLocal: boolean;
  }>;
  description: string;
  createdAt: string;
}

export interface RouteData {
  trackPoints?: Array<{
    latitude: number;
    longitude: number;
    timestamp?: string;
    speed?: number;
    accuracy?: number;
    heading?: number;
    altitude?: number;
    verticalAccuracy?: number;
  }>;
  totalDistance?: number; // in meters
  duration?: number; // in seconds
  startTime?: string;
  endTime?: string;
  source?: 'gps_tracking' | 'gpx_upload' | 'manual' | 'screenshot';
}

export interface ScoringResult {
  scoringModel: string;
  config: ScoringConfig;
  distanceKm: number;
  distancePoints: number;
  placePoints: number;
  themeBonus?: number;
  startEndDistance?: number;
  distancePenalty?: boolean;
  peaks: number;
  towers: number;
  trees: number;
  others: number;
  places: string[];
  totalPoints: number;
  durationMinutes: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total distance from trackPoints
 * Returns distance in meters
 */
export function calculateTotalDistance(
  trackPoints: Array<{ latitude: number; longitude: number }>
): number {
  if (!trackPoints || trackPoints.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];
    totalDistance += calculateDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
  }

  return totalDistance;
}

/**
 * Calculate duration from trackPoints
 * Returns duration in seconds
 */
export function calculateDuration(
  trackPoints: Array<{ timestamp?: string }>
): number {
  if (!trackPoints || trackPoints.length < 2) return 0;

  const first = trackPoints[0];
  const last = trackPoints[trackPoints.length - 1];

  if (!first.timestamp || !last.timestamp) return 0;

  const start = new Date(first.timestamp);
  const end = new Date(last.timestamp);

  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Calculate points for a visit based on scoring config
 */
export function calculatePoints(
  route: RouteData,
  places: Place[],
  config: ScoringConfig,
  isExemptFromDistanceLimit: boolean = false,
  monthlyThemeKeywords: string[] = []
): ScoringResult {
  // Calculate distance in km
  let distanceMeters = route.totalDistance ?? 0;
  if (!distanceMeters && route.trackPoints && route.trackPoints.length >= 2) {
    distanceMeters = calculateTotalDistance(route.trackPoints);
  }
  const distanceKm = distanceMeters / 1000;

  // Calculate duration in minutes
  let durationSeconds = route.duration ?? 0;
  if (!durationSeconds && route.trackPoints && route.trackPoints.length >= 2) {
    durationSeconds = calculateDuration(route.trackPoints);
  }
  const durationMinutes = Math.floor(durationSeconds / 60);

  // Count places by type
  const placeTypeCounts = {
    peaks: places.filter((p) => p.type === 'PEAK').length,
    towers: places.filter((p) => p.type === 'TOWER').length,
    trees: places.filter((p) => p.type === 'TREE').length,
    others: places.filter((p) => p.type === 'OTHER').length,
  };

  // Check 3km distance limit (Start vs End)
  let distancePenalty = false;
  let startEndDistance = 0;

  if (route.trackPoints && route.trackPoints.length >= 2) {
    const start = route.trackPoints[0];
    const end = route.trackPoints[route.trackPoints.length - 1];
    startEndDistance = calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude);

    // If distance between start and end > 3km, it's not a loop
    if (startEndDistance > 3000 && !isExemptFromDistanceLimit) {
      distancePenalty = true;
    }
  }

  // Calculate bonus points for Monthly Theme
  let themeBonus = 0;
  if (monthlyThemeKeywords && monthlyThemeKeywords.length > 0) {
    const placesText = places.map(p => p.description || "").join(" ").toLowerCase();
    // Check if any keyword matches
    const matchesTheme = monthlyThemeKeywords.some(keyword => placesText.includes(keyword.toLowerCase()));
    if (matchesTheme) {
      themeBonus = 5; // Fixed 5 points bonus for theme matching
    }
  }

  // Calculate distance points
  let distancePoints = 0;
  if (distanceKm >= config.minDistanceKm) {
    distancePoints = distanceKm * config.pointsPerKm;
  }

  // Calculate place points
  let placePoints = 0;
  placePoints += placeTypeCounts.peaks * (config.placeTypePoints.PEAK ?? 0);
  placePoints += placeTypeCounts.towers * (config.placeTypePoints.TOWER ?? 0);
  placePoints += placeTypeCounts.trees * (config.placeTypePoints.TREE ?? 0);
  placePoints += placeTypeCounts.others * (config.placeTypePoints.OTHER ?? 0);

  // Calculate total points
  let totalPoints = 0;
  if (config.requireAtLeastOnePlace) {
    // Only award points if at least one place is visited
    if (places.length > 0) {
      totalPoints = distancePoints + placePoints + themeBonus;
    }
  } else {
    // Award points even without places
    totalPoints = distancePoints + placePoints + themeBonus;
  }

  // Apply penalty
  if (distancePenalty) {
    totalPoints = 0;
  }

  // Round down to 1 decimal place
  totalPoints = Math.floor(totalPoints * 10) / 10;
  distancePoints = Math.floor(distancePoints * 10) / 10;
  placePoints = Math.floor(placePoints * 10) / 10;

  return {
    scoringModel: 'configurable_v1',
    config,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    distancePoints,
    placePoints,
    themeBonus,
    startEndDistance: Math.round(startEndDistance),
    distancePenalty,
    peaks: placeTypeCounts.peaks,
    towers: placeTypeCounts.towers,
    trees: placeTypeCounts.trees,
    others: placeTypeCounts.others,
    places: places.map((p) => p.name),
    totalPoints,
    durationMinutes,
  };
}

/**
 * Get default scoring config
 */
export function getDefaultScoringConfig(): ScoringConfig {
  return {
    pointsPerKm: 2.0,
    minDistanceKm: 3.0,
    requireAtLeastOnePlace: true,
    placeTypePoints: {
      PEAK: 1.0,
      TOWER: 1.0,
      TREE: 1.0,
      OTHER: 0.0,
    },
  };
}

