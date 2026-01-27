import { db } from './db';
import { format } from 'date-fns';

export interface CategoryAvailability {
    available: boolean;
    message?: string;
    isFirstThisMonth?: boolean;
}

/**
 * Checks if a user can use a specific Strakatá Trasa category this month.
 * Rules:
 * 1. Each category can be used max 1x per user per month.
 * 2. Bonus points are awarded if they are the first person (overall) to complete it this month.
 */
export async function checkCategoryAvailability(
    userId: string,
    categoryId: string
): Promise<CategoryAvailability> {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');

    // 1. Check if user already used this category this month
    const userUsage = await db.userCategoryUsage.findFirst({
        where: {
            userId,
            categoryId,
            month: currentMonth
        }
    });

    if (userUsage) {
        return {
            available: false,
            message: 'Tuto kategorii jste již tento měsíc využili. Každou kategorii lze využít maximálně jednou za měsíc.'
        };
    }

    // 2. Check if anyone else used it this month (to award bonus)
    const anyUsage = await db.userCategoryUsage.findFirst({
        where: {
            categoryId,
            month: currentMonth
        }
    });

    return {
        available: true,
        isFirstThisMonth: !anyUsage
    };
}

/**
 * Records usage of a Strakatá Trasa category and returns points to award.
 */
export async function recordCategoryUsage(
    userId: string,
    categoryId: string,
    visitId: string
): Promise<{ points: number; isFirst: boolean }> {
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');

    // Re-check for "first person" bonus to avoid race conditions
    const anyUsage = await db.userCategoryUsage.findFirst({
        where: {
            categoryId,
            month: currentMonth
        }
    });

    const isFirst = !anyUsage;
    const points = isFirst ? 2 : 1; // 1 point for completion + 1 bonus point if first

    await db.userCategoryUsage.create({
        data: {
            userId,
            categoryId,
            month: currentMonth,
            points,
            visitId
        }
    });

    return { points, isFirst };
}
