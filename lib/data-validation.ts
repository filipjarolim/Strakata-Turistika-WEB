/**
 * Data validation and conversion utilities for handling database inconsistencies
 */

/**
 * Safely convert a value to Date, handling string dates and null/undefined values
 */
export function safeDateConversion(value: unknown): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) {
    return value;
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${value}`);
      return null;
    }
    return date;
  }
  
  if (typeof value === 'number') {
    // Handle timestamp
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp: ${value}`);
      return null;
    }
    return date;
  }
  
  console.warn(`Unexpected date value type: ${typeof value}, value: ${value}`);
  return null;
}

/**
 * Safely convert a value to number
 */
export function safeNumberConversion(value: unknown): number {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  console.warn(`Unexpected number value type: ${typeof value}, value: ${value}`);
  return 0;
}

/**
 * Safely convert a value to string
 */
export function safeStringConversion(value: unknown): string {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'string') {
    return value;
  }
  
  return String(value);
}

/**
 * Validate and clean visit data from database
 */
export function cleanVisitData(rawVisit: Record<string, unknown>): Record<string, unknown> {
  return {
    ...rawVisit,
    // Ensure we have a proper ID field
    id: rawVisit.id || rawVisit._id || '',
    visitDate: safeDateConversion(rawVisit.visitDate),
    createdAt: safeDateConversion(rawVisit.createdAt),
    points: safeNumberConversion(rawVisit.points),
    // Handle both 'year' and 'seasonYear' fields
    year: safeNumberConversion(rawVisit.year || rawVisit.seasonYear),
    seasonYear: safeNumberConversion(rawVisit.seasonYear || rawVisit.year),
    routeTitle: safeStringConversion(rawVisit.routeTitle),
    visitedPlaces: safeStringConversion(rawVisit.visitedPlaces),
    dogNotAllowed: safeStringConversion(rawVisit.dogNotAllowed),
    routeLink: safeStringConversion(rawVisit.routeLink),
    rejectionReason: safeStringConversion(rawVisit.rejectionReason)
  };
}

/**
 * Validate and clean user data from database
 */
export function cleanUserData(rawUser: Record<string, unknown>): Record<string, unknown> | null {
  if (!rawUser) return null;
  
  return {
    ...rawUser,
    // Ensure we have a proper user ID field
    id: rawUser.id || rawUser._id || '',
    name: safeStringConversion(rawUser.name),
    dogName: safeStringConversion(rawUser.dogName),
    image: safeStringConversion(rawUser.image)
  };
}

/**
 * Validate and clean extra points data
 */
export function cleanExtraPointsData(rawExtraPoints: unknown): Record<string, unknown> {
  if (!rawExtraPoints || typeof rawExtraPoints !== 'object') return {};
  
  const extraPoints = rawExtraPoints as Record<string, unknown>;
  
  return {
    ...extraPoints,
    fullName: safeStringConversion(extraPoints.fullName),
    distanceKm: safeNumberConversion(extraPoints.distanceKm),
    description: safeStringConversion(extraPoints.description),
    distance: safeNumberConversion(extraPoints.distance),
    elapsedTime: safeNumberConversion(extraPoints.elapsedTime),
    averageSpeed: safeNumberConversion(extraPoints.averageSpeed)
  };
}

/**
 * Process raw database visit data with full validation
 */
export function processVisitData(rawVisit: Record<string, unknown>): Record<string, unknown> {
  const cleanedVisit = cleanVisitData(rawVisit);
  const cleanedUser = cleanUserData(rawVisit.user as Record<string, unknown>);
  const cleanedExtraPoints = cleanExtraPointsData(rawVisit.extraPoints);
  
  // Debug user data processing
  const hasNameInExtraPoints = cleanedExtraPoints?.fullName || (cleanedExtraPoints as Record<string, unknown>)?.['Příjmení a jméno'];
  if (!cleanedUser?.name && !hasNameInExtraPoints) {
    console.log('Processing visit with missing user data:', {
      visitId: cleanedVisit.id,
      userId: cleanedVisit.userId,
      rawUser: rawVisit.user,
      cleanedUser,
      extraPoints: cleanedExtraPoints
    });
  }
  
  // Implement priority system for user names
  const displayName = cleanedUser?.name ||                                    // Priorita 1: user.name z User kolekce
                      cleanedExtraPoints?.fullName ||                         // Priorita 2: extraPoints.fullName (legacy)
                      (cleanedExtraPoints as Record<string, unknown>)?.['Příjmení a jméno'] ||    // Priorita 3: extraPoints['Příjmení a jméno'] (current format)
                      cleanedUser?.id ||                                      // Fallback to user ID
                      'Unknown User';                                         // Final fallback

  // Debug the display name generation
  if (displayName !== 'Unknown User') {
    console.log(`Generated displayName: "${displayName}" for visit ${cleanedVisit.id}`, {
      user_name: cleanedUser?.name,
      extraPoints_fullName: cleanedExtraPoints?.fullName,
      extraPoints_jmeno: (cleanedExtraPoints as Record<string, unknown>)?.['Příjmení a jméno'],
      user_id: cleanedUser?.id
    });
  }
  
  return {
    ...cleanedVisit,
    user: cleanedUser,
    extraPoints: cleanedExtraPoints,
    displayName
  };
}

/**
 * Log data validation issues for debugging
 */
export function logDataValidationIssues(data: unknown[], context: string) {
  const issues: string[] = [];
  
  data.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    
    const record = item as Record<string, unknown>;
    
    // Check visitDate (can be null, string, or Date - we'll convert strings)
    if (record.visitDate !== null && record.visitDate !== undefined && 
        !(record.visitDate instanceof Date) && typeof record.visitDate !== 'string') {
      issues.push(`Item ${index}: Invalid visitDate (${typeof record.visitDate}): ${record.visitDate}`);
    }
    
    // Check points
    if (typeof record.points !== 'number' || isNaN(record.points)) {
      issues.push(`Item ${index}: Invalid points (${typeof record.points}): ${record.points}`);
    }
    
    // Check year (can be either 'year' or 'seasonYear')
    const yearValue = record.year || record.seasonYear;
    if (typeof yearValue !== 'number' || isNaN(yearValue as number)) {
      issues.push(`Item ${index}: Invalid year (${typeof yearValue}): ${yearValue} - raw: ${JSON.stringify({year: record.year, seasonYear: record.seasonYear})}`);
    }
    
    // Check ID
    if (!record.id && !record._id) {
      issues.push(`Item ${index}: Missing ID field`);
    }
  });
  
  if (issues.length > 0) {
    console.warn(`Data validation issues in ${context}:`, issues);
  }
}
