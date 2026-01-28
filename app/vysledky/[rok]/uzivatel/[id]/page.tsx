import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { UserStatsClient, UserData } from './user-stats-client';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';

interface PageProps {
    params: Promise<{
        rok: string;
        id: string;
    }>
}

export default async function UserStatsPage({ params }: PageProps) {
    const { rok, id } = await params;
    const year = parseInt(rok);

    if (isNaN(year)) return notFound();

    // Fetch logged in user to check permissions or show own private data
    const loggedInUser = await currentUser();

    // Fetch target user
    const user = await db.user.findUnique({
        where: { id },
        include: {
            visitData: {
                where: { year, state: 'APPROVED' },
                orderBy: { visitDate: 'desc' }
            },
        }
    });

    if (!user) return notFound();

    // Map visitData to visits for the client component
    const userWithMappedVisits = {
        ...user,
        visits: user.visitData
    };

    // Calculate advanced stats server-side or pass data to client
    // Passing data to client for interactive dashboard

    // Fetch created routes by this user
    const createdRoutes = await db.customRoute.findMany({
        where: { creatorId: id },
        include: {
            _count: {
                select: { visits: true } // Assuming we can count visits or use VisitData filtering
            }
        }
    });

    // Since we don't have direct relation visited->route in schema usually (unless VisitData has customRouteId relation), we filtered by userId. 
    // We can also fetch all visits to this user's routes by others?
    // Let's stick to what we have.

    return (
        <CommonPageTemplate contents={{ complete: true }} currentUser={loggedInUser}>
            <UserStatsClient
                user={userWithMappedVisits as UserData}
                year={year}
                className=""
                loggedInUserId={loggedInUser?.id}
                createdRoutes={createdRoutes}
            />
        </CommonPageTemplate>
    );
}
