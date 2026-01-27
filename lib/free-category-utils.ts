import { db } from './db';
import { getISOWeek, getYear } from 'date-fns';

export interface FreeCategoryStatus {
    available: boolean;
    week: number;
    year: number;
    lastVisitId?: string;
}

interface FreeCategoryUsageItem {
    week: number;
    year: number;
    used: boolean;
    visitId?: string;
    date?: string;
}

/**
 * Checks if the user can submit a "VOLNÁ" category visit this week.
 * Users get 1 free category submission per week.
 */
export async function checkFreeCategoryAvailability(userId: string): Promise<FreeCategoryStatus> {
    const now = new Date();
    const week = getISOWeek(now);
    const year = getYear(now);

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { freeCategoryUsage: true }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const usage = (user.freeCategoryUsage as unknown as FreeCategoryUsageItem[]) || [];
    const currentWeekUsage = usage.find(u => u.week === week && u.year === year);

    if (currentWeekUsage) {
        return {
            available: false,
            week,
            year,
            lastVisitId: currentWeekUsage.visitId
        };
    }

    return {
        available: true,
        week,
        year
    };
}

/**
 * Records usage of a free category submission.
 */
export async function recordFreeCategoryUsage(userId: string, visitId: string) {
    const now = new Date();
    const week = getISOWeek(now);
    const year = getYear(now);

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { freeCategoryUsage: true }
    });

    if (!user) throw new Error('User not found');

    const usage = (user.freeCategoryUsage as unknown as FreeCategoryUsageItem[]) || [];

    // Clean up old usage (optional, but keep it clean - e.g. keep only last 52 weeks or current year)
    const updatedUsage = [
        ...usage.filter(u => !(u.week === week && u.year === year)),
        { week, year, used: true, visitId, date: now.toISOString() }
    ];

    await db.user.update({
        where: { id: userId },
        data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            freeCategoryUsage: updatedUsage as any
        }
    });
}
