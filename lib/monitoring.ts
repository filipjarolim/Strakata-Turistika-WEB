/**
 * Monitoring and logging utilities for production observability
 */

export function logCriticalEvent(
    event: string,
    data: Record<string, unknown>
) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: 'CRITICAL',
        event,
        ...data
    };

    console.log(`[MONITORING] ${JSON.stringify(logEntry)}`);

    // In production, you would send this to a service like Sentry, LogRocket, or Axiom
    if (process.env.NODE_ENV === 'production') {
        // Example: Sentry.captureMessage(event, { extra: data });
    }
}

export function logVisitSubmission(visitId: string, userId: string, points: number) {
    logCriticalEvent('VISIT_SUBMITTED', { visitId, userId, points });
}

export function logBonusAwarded(userId: string, type: string, amount: number) {
    logCriticalEvent('BONUS_AWARDED', { userId, type, amount });
}

export function logAuthFailure(userId: string, reason: string) {
    logCriticalEvent('AUTH_FAILURE', { userId, reason });
}

export function logSystemError(error: Error, context: string) {
    logCriticalEvent('SYSTEM_ERROR', {
        message: error.message,
        stack: error.stack,
        context
    });
}
