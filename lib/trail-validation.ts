import * as turf from '@turf/turf';

export interface ProximityResult {
    valid: boolean;
    distanceMeter: number;
    message?: string;
}

/**
 * Validates if a point is within a certain distance of a path.
 * @param point { lat: number, lng: number }
 * @param path Array of { lat: number, lng: number }
 * @param maxDistanceMeter Maximum allowed distance in meters (default 100m)
 */
export function validateProximityToPath(
    point: { lat: number; lng: number },
    path: { lat: number; lng: number }[],
    maxDistanceMeter: number = 100
): ProximityResult {
    if (!path || path.length < 2) {
        return { valid: true, distanceMeter: 0 }; // Cannot validate without path
    }

    // Create Turf features
    const pointFeature = turf.point([point.lng, point.lat]);
    const lineCoords = path.map(p => [p.lng, p.lat]);
    const lineFeature = turf.lineString(lineCoords);

    // Calculate distance
    const distanceKm = turf.pointToLineDistance(pointFeature, lineFeature, { units: 'kilometers' });
    const distanceMeter = distanceKm * 1000;

    if (distanceMeter > maxDistanceMeter) {
        return {
            valid: false,
            distanceMeter,
            message: `Bod je ${Math.round(distanceMeter)}m od trasy (limit je ${maxDistanceMeter}m).`
        };
    }

    return {
        valid: true,
        distanceMeter
    };
}

/**
 * Validates multiple places against a path
 */
export function validatePlacesProximity(
    places: any[],
    path: any[],
    isFreeCategory: boolean = false
): ProximityResult[] {
    // If it's a free category, we don't enforce trail proximity for the target POI
    // However, usually we might have multiple places. 
    // For simplicity, if isFreeCategory is true, we skip path validation.
    if (isFreeCategory) return [];

    return places.map(place => {
        if (!place.lat || !place.lng) return { valid: true, distanceMeter: 0 };
        return validateProximityToPath({ lat: place.lat, lng: place.lng }, path);
    });
}
