"use server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const getUserStats = async () => {
    const user = await currentUser();

    if (!user) {
        return { error: "Nejste autorizovaný" };
    }

    try {
        // Get all visit data for the current user
        const visitData = await db.visitData.findMany({
            where: {
                userId: user.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate statistics
        const totalVisits = visitData.length;
        const totalPoints = visitData.reduce((sum, visit) => sum + visit.points, 0);
        const approvedVisits = visitData.filter(visit => visit.state === 'APPROVED').length;
        const pendingVisits = visitData.filter(visit => visit.state === 'PENDING_REVIEW').length;
        const draftVisits = visitData.filter(visit => visit.state === 'DRAFT').length;
        const rejectedVisits = visitData.filter(visit => visit.state === 'REJECTED').length;

        // Get visits by year
        const visitsByYear = visitData.reduce((acc, visit) => {
            const year = visit.year;
            if (!acc[year]) {
                acc[year] = {
                    count: 0,
                    points: 0,
                    approved: 0
                };
            }
            acc[year].count++;
            acc[year].points += visit.points;
            if (visit.state === 'APPROVED') {
                acc[year].approved++;
            }
            return acc;
        }, {} as Record<number, { count: number; points: number; approved: number }>);

        // Get recent visits (last 5)
        const recentVisits = visitData.slice(0, 5);

        // Calculate average points per visit
        const averagePoints = totalVisits > 0 ? Math.round(totalPoints / totalVisits) : 0;

        return {
            success: true,
            stats: {
                totalVisits,
                totalPoints,
                averagePoints,
                approvedVisits,
                pendingVisits,
                draftVisits,
                rejectedVisits,
                visitsByYear,
                recentVisits
            }
        };
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return { error: "Chyba při načítání statistik" };
    }
}; 