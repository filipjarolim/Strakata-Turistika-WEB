import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { format } from 'date-fns';

export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        // 1. Get all categories
        const categories = await db.strataCategory.findMany({
            orderBy: { name: 'asc' }
        });

        const now = new Date();
        const currentMonth = format(now, 'yyyy-MM');

        // 2. Enhance categories with availability for the current user
        const enhancedCategories = await Promise.all(categories.map(async (cat) => {
            // Check if anyone has used it this month (for the Star/First indicator)
            const firstUsage = await db.userCategoryUsage.findFirst({
                where: {
                    categoryId: cat.id,
                    month: currentMonth
                }
            });

            // If user is logged in, check if they used it
            let userUsed = false;
            if (userId) {
                const usage = await db.userCategoryUsage.findFirst({
                    where: {
                        userId,
                        categoryId: cat.id,
                        month: currentMonth
                    }
                });
                userUsed = !!usage;
            }

            return {
                ...cat,
                isFirstThisMonth: !firstUsage,
                userUsed
            };
        }));

        return NextResponse.json(enhancedCategories);
    } catch (error) {
        console.error('[STRATA_CATEGORIES_ERROR]', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
