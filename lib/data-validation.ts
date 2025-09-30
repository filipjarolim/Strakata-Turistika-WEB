/**
 * Data validation and conversion utilities for handling database inconsistencies
 */

/**
 * Safely convert a value to Date, handling string dates and null/undefined values
 */
export function safeDateConversion(value: any): Date | null {
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
export function safeNumberConversion(value: any): number {
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
export function safeStringConversion(value: any): string {
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'string') {
    return value;
  }
  
  return String(value);
}

/**
 * Validate and clean visit data from database
 */
export function cleanVisitData(rawVisit: any): any {
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
export function cleanUserData(rawUser: any): any {
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
export function cleanExtraPointsData(rawExtraPoints: any): any {
  if (!rawExtraPoints) return {};
  
  return {
    ...rawExtraPoints,
    fullName: safeStringConversion(rawExtraPoints.fullName),
    distanceKm: safeNumberConversion(rawExtraPoints.distanceKm),
    description: safeStringConversion(rawExtraPoints.description),
    distance: safeNumberConversion(rawExtraPoints.distance),
    elapsedTime: safeNumberConversion(rawExtraPoints.elapsedTime),
    averageSpeed: safeNumberConversion(rawExtraPoints.averageSpeed)
  };
}

/**
 * Process raw database visit data with full validation
 */
export function processVisitData(rawVisit: any) {
  const cleanedVisit = cleanVisitData(rawVisit);
  const cleanedUser = cleanUserData(rawVisit.user);
  const cleanedExtraPoints = cleanExtraPointsData(rawVisit.extraPoints);
  
  // Debug user data processing
  const hasNameInExtraPoints = cleanedExtraPoints?.fullName || (cleanedExtraPoints as any)?.['Příjmení a jméno'];
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
                      (cleanedExtraPoints as any)?.['Příjmení a jméno'] ||    // Priorita 3: extraPoints['Příjmení a jméno'] (current format)
                      cleanedUser?.id ||                                      // Fallback to user ID
                      'Unknown User';                                         // Final fallback

  // Debug the display name generation
  if (displayName !== 'Unknown User') {
    console.log(`Generated displayName: "${displayName}" for visit ${cleanedVisit.id}`, {
      user_name: cleanedUser?.name,
      extraPoints_fullName: cleanedExtraPoints?.fullName,
      extraPoints_jmeno: (cleanedExtraPoints as any)?.['Příjmení a jméno'],
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
export function logDataValidationIssues(data: any[], context: string) {
  const issues: string[] = [];
  
  data.forEach((item, index) => {
    // Check visitDate (can be null, string, or Date - we'll convert strings)
    if (item.visitDate !== null && item.visitDate !== undefined && 
        !(item.visitDate instanceof Date) && typeof item.visitDate !== 'string') {
      issues.push(`Item ${index}: Invalid visitDate (${typeof item.visitDate}): ${item.visitDate}`);
    }
    
    // Check points
    if (typeof item.points !== 'number' || isNaN(item.points)) {
      issues.push(`Item ${index}: Invalid points (${typeof item.points}): ${item.points}`);
    }
    
    // Check year (can be either 'year' or 'seasonYear')
    const yearValue = item.year || item.seasonYear;
    if (typeof yearValue !== 'number' || isNaN(yearValue)) {
      issues.push(`Item ${index}: Invalid year (${typeof yearValue}): ${yearValue} - raw: ${JSON.stringify({year: item.year, seasonYear: item.seasonYear})}`);
    }
    
    // Check ID
    if (!item.id && !item._id) {
      issues.push(`Item ${index}: Missing ID field`);
    }
  });
  
  if (issues.length > 0) {
    console.warn(`Data validation issues in ${context}:`, issues);
  }
}
