import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string, merging Tailwind CSS classes correctly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * Calculates the great-circle distance between two points on the Earth's surface.
 * @param lat1 Latitude of the first point in decimal degrees.
 * @param lon1 Longitude of the first point in decimal degrees.
 * @param lat2 Latitude of the second point in decimal degrees.
 * @param lon2 Longitude of the second point in decimal degrees.
 * @returns Distance between the two points in kilometers.
 */
export const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (deg: number) => deg * (Math.PI / 180); // Convert degrees to radians

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
