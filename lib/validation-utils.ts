export interface ValidationResult {
    valid: boolean;
    error?: string;
    warning?: string;
}

/**
 * Checks if the photo visit date is within a certain limit (default 14 days)
 */
export function isPhotoWithinTimeLimit(
    visitDate: Date | string,
    uploadDate: Date = new Date(),
    maxDaysOld: number = 14
): boolean {
    const vDate = typeof visitDate === 'string' ? new Date(visitDate) : visitDate;
    if (isNaN(vDate.getTime())) return true; // Fail safe

    const diffInMs = uploadDate.getTime() - vDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays <= maxDaysOld;
}

/**
 * Validates a visit submission for photo age
 */
export function validateVisitSubmission(data: {
    visitDate: Date | string;
    uploadDate?: Date;
}): ValidationResult {
    const uploadDate = data.uploadDate || new Date();

    if (!isPhotoWithinTimeLimit(data.visitDate, uploadDate)) {
        return {
            valid: false,
            error: 'Fotka je starší než 14 dní od data návštěvy. Podle pravidel nebude návštěva uznána.'
        };
    }

    return { valid: true };
}

/**
 * Validates activity type for the current season (2025/2026 allows only WALKING)
 */
export const ALLOWED_ACTIVITY_TYPES_2025_2026 = ['WALKING'];

export function isActivityTypeAllowed(type: string | null | undefined): boolean {
    if (!type) return true; // Default to allowed if not provided (assumed walking)
    return ALLOWED_ACTIVITY_TYPES_2025_2026.includes(type.toUpperCase());
}

export function validateActivityType(activityType: string | null | undefined): ValidationResult {
    if (!activityType) return { valid: true };

    if (!isActivityTypeAllowed(activityType)) {
        return {
            valid: false,
            error: `Aktivita "${activityType}" není v letošním ročníku povolena. Povolena je pouze chůze.`
        };
    }
    return { valid: true };
}
